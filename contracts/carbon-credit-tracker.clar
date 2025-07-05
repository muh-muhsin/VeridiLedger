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
(define-constant ERR_LISTING_NOT_FOUND (err u106))
(define-constant ERR_LISTING_EXPIRED (err u107))
(define-constant ERR_LISTING_INACTIVE (err u108))
(define-constant ERR_INSUFFICIENT_PAYMENT (err u109))
(define-constant ERR_ESCROW_NOT_FOUND (err u110))
(define-constant ERR_ESCROW_EXPIRED (err u111))
(define-constant ERR_INVALID_PRICE (err u112))
(define-constant ERR_CANNOT_BUY_OWN_LISTING (err u113))
(define-constant ERR_LISTING_ALREADY_EXISTS (err u114))

;; SIP-009 NFT trait implementation
(impl-trait 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait.nft-trait)

;; Data variables
(define-data-var last-token-id uint u0)
(define-data-var total-retired uint u0)
(define-data-var contract-uri (optional (string-utf8 256)) none)
(define-data-var marketplace-fee-rate uint u250) ;; 2.5% fee (250 basis points)
(define-data-var total-marketplace-volume uint u0)
(define-data-var platform-fee-recipient principal CONTRACT_OWNER)

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

;; Marketplace data structures
(define-map marketplace-listings uint {
    seller: principal,
    price-ustx: uint,
    listed-at: uint,
    expires-at: uint,
    is-active: bool
})

(define-map escrow-deposits {buyer: principal, token-id: uint} {
    amount-ustx: uint,
    deposited-at: uint,
    expires-at: uint
})

(define-map price-history uint (list 10 {
    price-ustx: uint,
    timestamp: uint,
    transaction-type: (string-ascii 16) ;; "sale", "listing", "delisting"
}))

(define-map marketplace-stats principal {
    total-sales: uint,
    total-purchases: uint,
    total-volume-ustx: uint
})

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

(define-private (emit-listing-event (token-id uint) (seller principal) (price-ustx uint))
    (print {
        event: "credit-listed",
        token-id: token-id,
        seller: seller,
        price-ustx: price-ustx,
        block-height: block-height
    })
)

(define-private (emit-sale-event (token-id uint) (seller principal) (buyer principal) (price-ustx uint))
    (print {
        event: "credit-sold",
        token-id: token-id,
        seller: seller,
        buyer: buyer,
        price-ustx: price-ustx,
        block-height: block-height
    })
)

(define-private (emit-delisting-event (token-id uint) (seller principal))
    (print {
        event: "credit-delisted",
        token-id: token-id,
        seller: seller,
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

;; ============================================================================
;; MARKETPLACE FUNCTIONS
;; ============================================================================

;; List a carbon credit for sale on the marketplace
(define-public (list-credit-for-sale (token-id uint) (price-ustx uint) (duration-blocks uint))
    (let ((current-owner (unwrap! (map-get? credit-ownership token-id) ERR_NOT_FOUND))
          (metadata (unwrap! (map-get? credit-metadata token-id) ERR_NOT_FOUND))
          (expires-at (+ block-height duration-blocks)))

        ;; Verify authorization (only owner can list)
        (asserts! (is-eq tx-sender current-owner) ERR_UNAUTHORIZED)

        ;; Verify credit is not retired
        (asserts! (not (get is-retired metadata)) ERR_CREDIT_RETIRED)

        ;; Verify valid price
        (asserts! (> price-ustx u0) ERR_INVALID_PRICE)

        ;; Verify no existing active listing
        (asserts! (is-none (map-get? marketplace-listings token-id)) ERR_LISTING_ALREADY_EXISTS)

        ;; Create marketplace listing
        (map-set marketplace-listings token-id {
            seller: current-owner,
            price-ustx: price-ustx,
            listed-at: block-height,
            expires-at: expires-at,
            is-active: true
        })

        ;; Add to price history
        (add-to-price-history token-id price-ustx "listing")

        ;; Emit listing event
        (emit-listing-event token-id current-owner price-ustx)

        (ok token-id)
    )
)

;; Buy a carbon credit from the marketplace with escrow
(define-public (buy-credit (token-id uint))
    (let ((listing (unwrap! (map-get? marketplace-listings token-id) ERR_LISTING_NOT_FOUND))
          (seller (get seller listing))
          (price-ustx (get price-ustx listing))
          (platform-fee (/ (* price-ustx (var-get marketplace-fee-rate)) u10000))
          (seller-amount (- price-ustx platform-fee)))

        ;; Verify listing is active
        (asserts! (get is-active listing) ERR_LISTING_INACTIVE)

        ;; Verify listing hasn't expired
        (asserts! (< block-height (get expires-at listing)) ERR_LISTING_EXPIRED)

        ;; Verify buyer is not the seller
        (asserts! (not (is-eq tx-sender seller)) ERR_CANNOT_BUY_OWN_LISTING)

        ;; Verify credit still exists and is not retired
        (let ((metadata (unwrap! (map-get? credit-metadata token-id) ERR_NOT_FOUND)))
            (asserts! (not (get is-retired metadata)) ERR_CREDIT_RETIRED)
        )

        ;; Transfer STX from buyer to seller (minus platform fee)
        (try! (stx-transfer? seller-amount tx-sender seller))

        ;; Transfer platform fee to fee recipient
        (try! (stx-transfer? platform-fee tx-sender (var-get platform-fee-recipient)))

        ;; Transfer the NFT from seller to buyer
        (try! (transfer token-id seller tx-sender))

        ;; Remove the listing
        (map-delete marketplace-listings token-id)

        ;; Update marketplace stats for seller
        (update-marketplace-stats seller "sale" price-ustx)

        ;; Update marketplace stats for buyer
        (update-marketplace-stats tx-sender "purchase" price-ustx)

        ;; Update total marketplace volume
        (var-set total-marketplace-volume (+ (var-get total-marketplace-volume) price-ustx))

        ;; Add to price history
        (add-to-price-history token-id price-ustx "sale")

        ;; Emit sale event
        (emit-sale-event token-id seller tx-sender price-ustx)

        (ok true)
    )
)

;; Cancel a marketplace listing
(define-public (cancel-listing (token-id uint))
    (let ((listing (unwrap! (map-get? marketplace-listings token-id) ERR_LISTING_NOT_FOUND))
          (seller (get seller listing)))

        ;; Verify authorization (only seller or contract owner can cancel)
        (asserts! (or
            (is-eq tx-sender seller)
            (is-eq tx-sender CONTRACT_OWNER)
        ) ERR_UNAUTHORIZED)

        ;; Remove the listing
        (map-delete marketplace-listings token-id)

        ;; Add to price history
        (add-to-price-history token-id (get price-ustx listing) "delisting")

        ;; Emit delisting event
        (emit-delisting-event token-id seller)

        (ok true)
    )
)

;; Update listing price
(define-public (update-listing-price (token-id uint) (new-price-ustx uint))
    (let ((listing (unwrap! (map-get? marketplace-listings token-id) ERR_LISTING_NOT_FOUND))
          (seller (get seller listing)))

        ;; Verify authorization (only seller can update)
        (asserts! (is-eq tx-sender seller) ERR_UNAUTHORIZED)

        ;; Verify listing is active
        (asserts! (get is-active listing) ERR_LISTING_INACTIVE)

        ;; Verify valid price
        (asserts! (> new-price-ustx u0) ERR_INVALID_PRICE)

        ;; Update the listing
        (map-set marketplace-listings token-id (merge listing {price-ustx: new-price-ustx}))

        ;; Add to price history
        (add-to-price-history token-id new-price-ustx "listing")

        ;; Emit listing event
        (emit-listing-event token-id seller new-price-ustx)

        (ok true)
    )
)

;; ============================================================================
;; MARKETPLACE HELPER FUNCTIONS
;; ============================================================================

;; Add entry to price history
(define-private (add-to-price-history (token-id uint) (price-ustx uint) (transaction-type (string-ascii 16)))
    (let ((current-history (default-to (list) (map-get? price-history token-id)))
          (new-entry {price-ustx: price-ustx, timestamp: block-height, transaction-type: transaction-type}))

        ;; Add new entry to the beginning of the list (most recent first)
        (let ((updated-history (unwrap-panic (as-max-len? (append (list new-entry) current-history) u10))))
            (map-set price-history token-id updated-history)
        )
    )
)

;; Update marketplace statistics for a user
(define-private (update-marketplace-stats (user principal) (action (string-ascii 16)) (amount-ustx uint))
    (let ((current-stats (default-to {total-sales: u0, total-purchases: u0, total-volume-ustx: u0}
                                   (map-get? marketplace-stats user))))
        (if (is-eq action "sale")
            (map-set marketplace-stats user {
                total-sales: (+ (get total-sales current-stats) u1),
                total-purchases: (get total-purchases current-stats),
                total-volume-ustx: (+ (get total-volume-ustx current-stats) amount-ustx)
            })
            (map-set marketplace-stats user {
                total-sales: (get total-sales current-stats),
                total-purchases: (+ (get total-purchases current-stats) u1),
                total-volume-ustx: (+ (get total-volume-ustx current-stats) amount-ustx)
            })
        )
    )
)

;; ============================================================================
;; MARKETPLACE READ-ONLY FUNCTIONS
;; ============================================================================

;; Get marketplace listing details
(define-read-only (get-listing (token-id uint))
    (map-get? marketplace-listings token-id)
)

;; Get price history for a token
(define-read-only (get-price-history (token-id uint))
    (map-get? price-history token-id)
)

;; Get marketplace statistics for a user
(define-read-only (get-marketplace-stats (user principal))
    (map-get? marketplace-stats user)
)

;; Get total marketplace volume
(define-read-only (get-total-marketplace-volume)
    (var-get total-marketplace-volume)
)

;; Get marketplace fee rate
(define-read-only (get-marketplace-fee-rate)
    (var-get marketplace-fee-rate)
)

;; Check if a credit is listed for sale
(define-read-only (is-credit-listed (token-id uint))
    (match (map-get? marketplace-listings token-id)
        listing (and (get is-active listing) (< block-height (get expires-at listing)))
        false
    )
)

;; Get active listings count (helper for analytics)
(define-read-only (get-active-listings-count)
    ;; Note: This is a simplified version. In production, you'd want to maintain a counter
    ;; or implement a more efficient way to count active listings
    u0 ;; Placeholder - would need iteration over all listings
)

;; Calculate platform fee for a given price
(define-read-only (calculate-platform-fee (price-ustx uint))
    (/ (* price-ustx (var-get marketplace-fee-rate)) u10000)
)

;; Calculate seller proceeds after fee
(define-read-only (calculate-seller-proceeds (price-ustx uint))
    (- price-ustx (calculate-platform-fee price-ustx))
)

;; ============================================================================
;; MARKETPLACE ADMINISTRATIVE FUNCTIONS
;; ============================================================================

;; Set marketplace fee rate (only contract owner)
(define-public (set-marketplace-fee-rate (new-rate uint))
    (begin
        (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
        (asserts! (<= new-rate u1000) ERR_INVALID_METADATA) ;; Max 10% fee
        (var-set marketplace-fee-rate new-rate)
        (ok true)
    )
)

;; Set platform fee recipient (only contract owner)
(define-public (set-platform-fee-recipient (new-recipient principal))
    (begin
        (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
        (var-set platform-fee-recipient new-recipient)
        (ok true)
    )
)

;; Emergency function to cancel any listing (only contract owner)
(define-public (emergency-cancel-listing (token-id uint))
    (begin
        (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
        (match (map-get? marketplace-listings token-id)
            listing (begin
                (map-delete marketplace-listings token-id)
                (emit-delisting-event token-id (get seller listing))
                (ok true)
            )
            ERR_LISTING_NOT_FOUND
        )
    )
)
