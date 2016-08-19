SELECT p.account_id, p.purchase_id, p.sku_id, p.date, p.billing_start_date, p.last_transaction_created_at, p.canceled
FROM purchase p
JOIN account a
ON a.account_id = p.account_id
WHERE a.terminated != true
AND p.terminated = false
AND p.sku_id != 'tectonic-preview'
AND p.sku_id != 'tectonic-enterprise-512-gb'
AND p.sku_id != 'quay-enterprise-tectonic-annual'
AND p.sku_id != 'quay-enterprise-managed-linux-addon'
ORDER BY p.account_id
