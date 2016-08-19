SELECT
    -- Account
    a.account_id, a.organization, a.phone as account_phone, a.signup_phase, a.pricing_model_id, a.stripe_customer_id, a.newsletter_email, a.changelog_email, a.payment_method, a.quay_id,
    -- Contact
    c.auth_id, c.contact_type, c.first_name, c.last_name, c.title, c.phone as owner_phone, c.email,
    -- Billing address
    baddr.street1 as billing_street1,baddr.street2 as billing_street2, baddr.city as billing_city, baddr.state as billing_state, baddr.postal_code as billing_postal_code, baddr.country as billing_country,
    -- Mailing address
    maddr.street1 as mailing_street1,maddr.street2 as mailing_street2, maddr.city as mailing_city, maddr.state as mailing_state, maddr.postal_code as mailing_postal_code, maddr.country as mailing_country,
    -- Cards
    card.stripe_card_id
FROM account a
LEFT JOIN contact c
    ON a.account_id=c.account_id
LEFT JOIN account_owner ao
    ON ao.account_id=a.account_id
    AND ao.contact_id=c.contact_id
LEFT JOIN address baddr
    ON baddr.address_id=a.billing_address_id
LEFT JOIN address maddr
    ON maddr.address_id=a.mailing_address_id
LEFT JOIN card
    ON card.card_id=a.primary_card_id
WHERE a.terminated != true
ORDER BY a.account_id
