;; VeridiLedger Carbon Credit Tracker Contract
;; A comprehensive SIP-009 compliant NFT contract for tracking carbon credits
;; Each NFT represents a unique carbon credit with detailed metadata

;; Contract constants and error codes
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_UNAUTHORIZED (err u100))
(define-constant ERR_NOT_FOUND (err u101))
(define-constant ERR_ALREADY_EXISTS (err u102))
(define-constant ERR_INVALID_METADATA (err u103))
(define-constant ERR_CREDIT_RETIRED (err u104))
(define-constant ERR_INVALID_RECIPIENT (err u105))

;; SIP-009 NFT trait implementation
(impl-trait 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait.nft-trait)

;; Data variables
(define-data-var last-token-id uint u0)
(define-data-var total-retired uint u0)
(define-data-var contract-uri (optional (string-utf8 256)) none)

;; Data maps for NFT functionality
(define-map token-count principal uint)
(define-map market-approved {token-id: uint, spender: principal} bool)
(define-map operator-approved {owner: principal, operator: principal} bool)

;; Carbon credit specific data structures
(define-map credit-metadata uint {
    project-id: (string-ascii 256),
    vintage-year: uint,
    quantity-tonnes: uint,
    issuing-registry: (string-ascii 128),
    methodology: (string-ascii 256),
    unique-identifier: (string-ascii 512),
    origination-date: uint,
    is-retired: bool
})

(define-map credit-ownership uint principal)
(define-map retirement-records uint {
    retired-by: principal,
    retirement-date: uint,
    retirement-reason: (string-ascii 512)
})

;; Access control maps
(define-map authorized-originators principal bool)

;; Events (using print statements for event emission)
(define-private (emit-origination-event (token-id uint) (recipient principal) (project-id (string-ascii 256)))
    (print {
        event: "credit-originated",
        token-id: token-id,
        recipient: recipient,
        project-id: project-id,
        block-height: block-height
    })
)

(define-private (emit-transfer-event (token-id uint) (sender principal) (recipient principal))
    (print {
        event: "credit-transferred",
        token-id: token-id,
        sender: sender,
        recipient: recipient,
        block-height: block-height
    })
)

(define-private (emit-retirement-event (token-id uint) (owner principal))
    (print {
        event: "credit-retired",
        token-id: token-id,
        owner: owner,
        block-height: block-height
    })
)

;; SIP-009 required functions

;; Get the last minted token ID
(define-read-only (get-last-token-id)
    (ok (var-get last-token-id))
)

;; Get the token URI for a specific token
(define-read-only (get-token-uri (token-id uint))
    (ok (some (concat 
        (unwrap-panic (var-get contract-uri))
        (uint-to-ascii token-id)
    )))
)

;; Get the owner of a specific token
(define-read-only (get-owner (token-id uint))
    (ok (map-get? credit-ownership token-id))
)

;; Transfer a token from sender to recipient
(define-public (transfer (token-id uint) (sender principal) (recipient principal))
    (let ((current-owner (unwrap! (map-get? credit-ownership token-id) ERR_NOT_FOUND)))
        ;; Verify authorization
        (asserts! (or 
            (is-eq tx-sender sender)
            (is-eq tx-sender current-owner)
            (default-to false (map-get? operator-approved {owner: current-owner, operator: tx-sender}))
            (default-to false (map-get? market-approved {token-id: token-id, spender: tx-sender}))
        ) ERR_UNAUTHORIZED)
        
        ;; Verify sender is current owner
        (asserts! (is-eq sender current-owner) ERR_UNAUTHORIZED)
        
        ;; Verify credit is not retired
        (asserts! (not (get is-retired (unwrap! (map-get? credit-metadata token-id) ERR_NOT_FOUND))) ERR_CREDIT_RETIRED)
        
        ;; Verify valid recipient
        (asserts! (not (is-eq recipient sender)) ERR_INVALID_RECIPIENT)
        
        ;; Execute transfer
        (map-set credit-ownership token-id recipient)
        
        ;; Update token counts
        (map-set token-count sender (- (default-to u0 (map-get? token-count sender)) u1))
        (map-set token-count recipient (+ (default-to u0 (map-get? token-count recipient)) u1))
        
        ;; Clear any market approvals
        (map-delete market-approved {token-id: token-id, spender: tx-sender})
        
        ;; Emit transfer event
        (emit-transfer-event token-id sender recipient)
        
        (ok true)
    )
)

;; Carbon Credit specific functions

;; Originate a new carbon credit (mint NFT with metadata)
(define-public (originate-credit
    (recipient principal)
    (project-id (string-ascii 256))
    (vintage-year uint)
    (quantity-tonnes uint)
    (issuing-registry (string-ascii 128))
    (methodology (string-ascii 256))
    (unique-identifier (string-ascii 512))
)
    (let ((token-id (+ (var-get last-token-id) u1)))
        ;; Verify authorization (only contract owner or authorized originators)
        (asserts! (or
            (is-eq tx-sender CONTRACT_OWNER)
            (default-to false (map-get? authorized-originators tx-sender))
        ) ERR_UNAUTHORIZED)

        ;; Validate metadata
        (asserts! (> (len project-id) u0) ERR_INVALID_METADATA)
        (asserts! (> vintage-year u1990) ERR_INVALID_METADATA)
        (asserts! (> quantity-tonnes u0) ERR_INVALID_METADATA)
        (asserts! (> (len issuing-registry) u0) ERR_INVALID_METADATA)
        (asserts! (> (len methodology) u0) ERR_INVALID_METADATA)
        (asserts! (> (len unique-identifier) u0) ERR_INVALID_METADATA)

        ;; Create credit metadata
        (map-set credit-metadata token-id {
            project-id: project-id,
            vintage-year: vintage-year,
            quantity-tonnes: quantity-tonnes,
            issuing-registry: issuing-registry,
            methodology: methodology,
            unique-identifier: unique-identifier,
            origination-date: block-height,
            is-retired: false
        })

        ;; Set ownership
        (map-set credit-ownership token-id recipient)

        ;; Update token count for recipient
        (map-set token-count recipient (+ (default-to u0 (map-get? token-count recipient)) u1))

        ;; Update last token ID
        (var-set last-token-id token-id)

        ;; Emit origination event
        (emit-origination-event token-id recipient project-id)

        (ok token-id)
    )
)

;; Retire a carbon credit (burn/lock the NFT)
(define-public (retire-credit (token-id uint) (retirement-reason (string-ascii 512)))
    (let ((current-owner (unwrap! (map-get? credit-ownership token-id) ERR_NOT_FOUND))
          (metadata (unwrap! (map-get? credit-metadata token-id) ERR_NOT_FOUND)))

        ;; Verify authorization (only owner can retire)
        (asserts! (is-eq tx-sender current-owner) ERR_UNAUTHORIZED)

        ;; Verify credit is not already retired
        (asserts! (not (get is-retired metadata)) ERR_CREDIT_RETIRED)

        ;; Update metadata to mark as retired
        (map-set credit-metadata token-id (merge metadata {is-retired: true}))

        ;; Record retirement details
        (map-set retirement-records token-id {
            retired-by: current-owner,
            retirement-date: block-height,
            retirement-reason: retirement-reason
        })

        ;; Update total retired count
        (var-set total-retired (+ (var-get total-retired) u1))

        ;; Update token count for owner
        (map-set token-count current-owner (- (default-to u0 (map-get? token-count current-owner)) u1))

        ;; Remove ownership (effectively burning the token)
        (map-delete credit-ownership token-id)

        ;; Emit retirement event
        (emit-retirement-event token-id current-owner)

        (ok true)
    )
)

;; Batch originate multiple credits
(define-public (batch-originate-credits
    (credits (list 10 {
        recipient: principal,
        project-id: (string-ascii 256),
        vintage-year: uint,
        quantity-tonnes: uint,
        issuing-registry: (string-ascii 128),
        methodology: (string-ascii 256),
        unique-identifier: (string-ascii 512)
    }))
)
    (begin
        ;; Verify authorization
        (asserts! (or
            (is-eq tx-sender CONTRACT_OWNER)
            (default-to false (map-get? authorized-originators tx-sender))
        ) ERR_UNAUTHORIZED)

        ;; Process each credit in the list
        (ok (map originate-single-credit credits))
    )
)

;; Helper function for batch origination
(define-private (originate-single-credit (credit {
    recipient: principal,
    project-id: (string-ascii 256),
    vintage-year: uint,
    quantity-tonnes: uint,
    issuing-registry: (string-ascii 128),
    methodology: (string-ascii 256),
    unique-identifier: (string-ascii 512)
}))
    (unwrap-panic (originate-credit
        (get recipient credit)
        (get project-id credit)
        (get vintage-year credit)
        (get quantity-tonnes credit)
        (get issuing-registry credit)
        (get methodology credit)
        (get unique-identifier credit)
    ))
)

;; Read-only functions for querying contract state

;; Get detailed information about a specific carbon credit
(define-read-only (get-credit-details (token-id uint))
    (map-get? credit-metadata token-id)
)

;; Get retirement information for a specific credit
(define-read-only (get-retirement-details (token-id uint))
    (map-get? retirement-records token-id)
)

;; Get the total number of credits originated
(define-read-only (get-total-supply)
    (var-get last-token-id)
)

;; Get the total number of credits retired
(define-read-only (get-total-retired)
    (var-get total-retired)
)

;; Get the number of active (non-retired) credits
(define-read-only (get-active-credits)
    (- (var-get last-token-id) (var-get total-retired))
)

;; Get the number of tokens owned by a principal
(define-read-only (get-balance (owner principal))
    (default-to u0 (map-get? token-count owner))
)

;; Check if a principal is an authorized originator
(define-read-only (is-authorized-originator (principal principal))
    (default-to false (map-get? authorized-originators principal))
)

;; Get contract URI
(define-read-only (get-contract-uri)
    (var-get contract-uri)
)

;; Check if a credit exists
(define-read-only (credit-exists (token-id uint))
    (is-some (map-get? credit-metadata token-id))
)

;; Check if a credit is retired
(define-read-only (is-credit-retired (token-id uint))
    (match (map-get? credit-metadata token-id)
        metadata (get is-retired metadata)
        false
    )
)

;; Get credits by vintage year (helper function for filtering)
(define-read-only (get-credit-vintage-year (token-id uint))
    (match (map-get? credit-metadata token-id)
        metadata (some (get vintage-year metadata))
        none
    )
)

;; Get credits by project ID (helper function for filtering)
(define-read-only (get-credit-project-id (token-id uint))
    (match (map-get? credit-metadata token-id)
        metadata (some (get project-id metadata))
        none
    )
)

;; Administrative functions

;; Add an authorized originator (only contract owner)
(define-public (add-originator (originator principal))
    (begin
        (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
        (map-set authorized-originators originator true)
        (ok true)
    )
)

;; Remove an authorized originator (only contract owner)
(define-public (remove-originator (originator principal))
    (begin
        (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
        (map-delete authorized-originators originator)
        (ok true)
    )
)

;; Set contract URI (only contract owner)
(define-public (set-contract-uri (uri (string-utf8 256)))
    (begin
        (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
        (var-set contract-uri (some uri))
        (ok true)
    )
)

;; SIP-009 marketplace functions

;; Approve a specific token for transfer by another principal
(define-public (approve (token-id uint) (spender principal))
    (let ((current-owner (unwrap! (map-get? credit-ownership token-id) ERR_NOT_FOUND)))
        ;; Verify authorization
        (asserts! (or
            (is-eq tx-sender current-owner)
            (default-to false (map-get? operator-approved {owner: current-owner, operator: tx-sender}))
        ) ERR_UNAUTHORIZED)

        ;; Verify credit is not retired
        (asserts! (not (get is-retired (unwrap! (map-get? credit-metadata token-id) ERR_NOT_FOUND))) ERR_CREDIT_RETIRED)

        ;; Set approval
        (map-set market-approved {token-id: token-id, spender: spender} true)
        (ok true)
    )
)

;; Revoke approval for a specific token
(define-public (revoke-approval (token-id uint) (spender principal))
    (let ((current-owner (unwrap! (map-get? credit-ownership token-id) ERR_NOT_FOUND)))
        ;; Verify authorization
        (asserts! (or
            (is-eq tx-sender current-owner)
            (default-to false (map-get? operator-approved {owner: current-owner, operator: tx-sender}))
        ) ERR_UNAUTHORIZED)

        ;; Remove approval
        (map-delete market-approved {token-id: token-id, spender: spender})
        (ok true)
    )
)

;; Set approval for all tokens (operator approval)
(define-public (set-approval-for-all (operator principal) (approved bool))
    (begin
        (asserts! (not (is-eq tx-sender operator)) ERR_INVALID_RECIPIENT)
        (map-set operator-approved {owner: tx-sender, operator: operator} approved)
        (ok true)
    )
)

;; Check if a spender is approved for a specific token
(define-read-only (is-approved-for (token-id uint) (spender principal))
    (default-to false (map-get? market-approved {token-id: token-id, spender: spender}))
)

;; Check if an operator is approved for all tokens of an owner
(define-read-only (is-approved-for-all (owner principal) (operator principal))
    (default-to false (map-get? operator-approved {owner: owner, operator: operator}))
)
