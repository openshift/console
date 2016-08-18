package main

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"time"

	"github.com/authclub/billforward/client"
	"github.com/authclub/billforward/client/subscriptions"
	"github.com/authclub/billforward/client/tokenization"
	"github.com/authclub/billforward/models"
	"github.com/go-openapi/strfmt"
	"github.com/go-openapi/swag"
	"golang.org/x/net/context"
	"google.golang.org/grpc"
	"google.golang.org/grpc/metadata"

	"github.com/coreos-inc/soy/common/billforward"
	"github.com/coreos-inc/soy/proto"
	"github.com/coreos-inc/soy/server"
	flag "github.com/spf13/pflag"
)

var (
	accountsCSV        string
	purchasesCSV       string
	quayRobots         string
	rpcEndpoint        string
	bfEndpoint         string
	accountsCursor     string
	purchasesCursor    string
	emailSuffix        string
	accountMappingFile string
	dryRun             bool

	asvc     proto.AccountServiceClient
	bfClient *client.BillForward

	products map[string]*proto.Product
	plans    map[string]*proto.RatePlan
)

func init() {
	log.SetOutput(os.Stdout)

	flag.StringVar(&rpcEndpoint, "rpc-endpoint", "127.0.0.1:8181", "soy server rpc endpoint")
	flag.StringVar(&bfEndpoint, "billforward-endpoint", "api-sandbox.billforward.net", "billforward API endpoint")
	flag.StringVar(&accountMappingFile, "account-mapping-file", ".account_mapping.json", "a json file containing mapping of custard accountID to BF accountID")
	flag.BoolVar(&dryRun, "dry-run", true, "Do not actually create anything")

	// account migrator flags
	flag.StringVar(&emailSuffix, "email-suffix", "", "add this to the end of emails for testing")
	flag.StringVar(&accountsCSV, "accounts-csv-file", "", "path to csv file containing denormalized accounts")
	flag.StringVar(&quayRobots, "quay-robots-file", "", "path to json file containing quay robot accounts")
	flag.StringVar(&accountsCursor, "accounts-cursor-file", ".cursor_accounts.txt", "path to file to  save cursor in")

	// purchase migrator flags
	flag.StringVar(&purchasesCursor, "purchases-cursor-file", ".cursor_purchases.txt", "path to file to  save cursor in")
	flag.StringVar(&purchasesCSV, "purchases-csv-file", "", "path to csv file containing denormalized purchases")
}

func main() {

	flag.Parse()
	args := flag.Args()
	if len(args) != 1 {
		log.Printf("must provide one argument of either 'accounts' or 'purchases'")
		return
	}
	if accountMappingFile == "" {
		log.Printf("must provide --account-mapping-file")
		return
	}
	if bfEndpoint == "" {
		log.Printf("must provide --billforward-endpoint")
		return
	}
	bfToken := os.Getenv("BILLFORWARD_API_KEY")
	if bfToken == "" {
		log.Printf("must set $BILLFORWARD_API_KEY environment variable")
		return
	}

	ctx, cancel := context.WithCancel(context.Background())

	var migrateFunc func(context.Context) error
	switch args[0] {
	case "accounts":
		if accountsCursor == "" {
			log.Printf("must provide --accounts-cursor-file")
			return
		}
		if accountsCSV == "" {
			log.Printf("must provide --accounts-csv-file")
			return
		}
		if quayRobots == "" {
			log.Printf("must provide --quay-robots-file")
			return
		}
		log.Printf("migrating accounts")
		migrateFunc = migrateAccounts
	case "purchases":
		if purchasesCursor == "" {
			log.Printf("must provide --purchases-cursor-file")
			return
		}
		if purchasesCSV == "" {
			log.Printf("must provide --purchases-csv-file")
			return
		}
		log.Printf("migrating purchases")
		migrateFunc = migratePurchases
	default:
		log.Printf("must provide one argument of either 'accounts' or 'purchases'")
		return
	}

	if dryRun {
		log.Println("running in dry run mode")
	}

	bfClient = billforward.NewClient(billforward.Config{
		BillforwardToken:    bfToken,
		BillforwardEndpoint: bfEndpoint,
	})

	rpcConn, err := grpc.Dial(rpcEndpoint, grpc.WithInsecure())
	if err != nil {
		log.Printf("error connecting to RPC server, err: %v", err)
		return
	}

	asvc = proto.NewAccountServiceClient(rpcConn)

	log.Printf("starting migration")
	errChan := make(chan error)
	go func() {
		errChan <- migrateFunc(ctx)
	}()

	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt)

	go func() {
		s := <-c
		log.Printf("got sig %s, stopping migration", s)
		cancel()
	}()

	err = <-errChan
	if err != nil {
		log.Printf("migration failed, err: %s", err)
		os.Exit(1)
	}
	log.Printf("migration suceeded!")
	os.Exit(0)
}

func migrateAccounts(ctx context.Context) error {
	quayRobotsFile, err := os.Open(quayRobots)
	if err != nil {
		return fmt.Errorf("unable to open file: %s", err)
	}
	defer quayRobotsFile.Close()

	// Mapping of quayID to token
	robotNameToToken := make(map[string]string)
	dec := json.NewDecoder(quayRobotsFile)
	for {
		var robot robotAuth
		if err := dec.Decode(&robot); err == io.EOF {
			break
		} else if err != nil {
			return err
		}
		robotNameToToken[robot.Name] = robot.Token
	}

	csvFile, err := os.Open(accountsCSV)
	if err != nil {
		return fmt.Errorf("unable to open file: %s", err)
	}
	defer csvFile.Close()

	mappingFile, err := os.Create(accountMappingFile)
	if err != nil {
		return fmt.Errorf("unable to open file: %s", err)
	}
	defer mappingFile.Close()

	mappingEncoder := json.NewEncoder(mappingFile)

	reader := csv.NewReader(csvFile)
	reader.Comma = '|'
	record, err := reader.Read()
	if err != nil {
		return fmt.Errorf("unable to read header fields from csv: %s", err)
	}

	headers := make(map[string]int)
	for i, col := range record {
		headers[col] = i
	}

	accountIDField := headers["account_id"]
	organizationField := headers["organization"]
	accountPhoneField := headers["account_phone"]
	quayIDField := headers["quay_id"]
	stripeCustomerIDField := headers["stripe_customer_id"]
	stripeCardIDField := headers["stripe_card_id"]
	paymentMethodField := headers["payment_method"]

	emailField := headers["email"]
	authIDField := headers["auth_id"]
	firstNameField := headers["first_name"]
	lastNameField := headers["last_name"]
	contactPhoneField := headers["contact_phone"]

	billingStreet1Field := headers["billing_street1"]
	billingStreet2Field := headers["billing_street2"]
	billingCityField := headers["billing_city"]
	billingStateField := headers["billing_state"]
	billingPostalCodeField := headers["billing_postal_code"]
	billingCountryField := headers["billing_country"]

	mailingStreet1Field := headers["mailing_street1"]
	mailingStreet2Field := headers["mailing_street2"]
	mailingCityField := headers["mailing_city"]
	mailingStateField := headers["mailing_state"]
	mailingPostalCodeField := headers["mailing_postal_code"]
	mailingCountryField := headers["mailing_country"]

	var i int
	cur, err := getCursor(accountsCursor)
	if err != nil {
		return fmt.Errorf("unable to get cursor")
	}
	log.Printf("got cursor. current position: %d", cur)

	for i != cur {
		reader.Read()
		i++
	}

	log.Println("------------------------------------------------------------")
	for {
		select {
		case <-ctx.Done():
			log.Printf("got stop signal, migrator stopping")
			return nil
		default:
		}

		i++
		err = saveCursor(accountsCursor, i)
		if err != nil {
			return fmt.Errorf("unable to save cursor to file: %s", err)
		}

		record, err = reader.Read()
		if err == io.EOF {
			break
		} else if err != nil {
			return fmt.Errorf("could not read record, err: %s", err)
		}

		email := record[emailField]
		dexID := record[authIDField]
		custardID := record[accountIDField]

		if email == "" {
			log.Printf("record %d, missing email skipping, accountID %s", i, custardID)
			continue
		}
		if dexID == "" {
			log.Printf("record %d, missing dexID skipping, accountID: %s", i, custardID)
			continue
		}

		paymentMethod := record[paymentMethodField]
		if paymentMethod != "CREDIT_CARD" {
			log.Printf("record %d, payment method skipping %s is not credit card, accountID: %s", i, paymentMethod, custardID)
			continue
		}

		oldEmail := email
		email += emailSuffix
		if emailSuffix == "" {
			log.Printf("record %d, custard accountID: %s, email: %s, dexID: %s", i, custardID, email, dexID)
		} else {
			log.Printf("record %d, custard accountID: %s, email: %s, emailWithSuffix: %s, dexID: %s", i, custardID, oldEmail, email, dexID)
		}

		profile := &proto.Profile{
			CompanyName: record[organizationField],
			Email:       email,
			FirstName:   record[firstNameField],
			LastName:    record[lastNameField],
			Landline:    record[accountPhoneField],
			Addresses:   []*proto.Address{},
		}

		mailingAddr := proto.Address{
			AddressLine1:   record[mailingStreet1Field],
			AddressLine2:   record[mailingStreet2Field],
			City:           record[mailingCityField],
			Province:       record[mailingStateField],
			Country:        record[mailingCountryField],
			Postcode:       record[mailingPostalCodeField],
			Landline:       record[contactPhoneField],
			PrimaryAddress: true,
		}

		if mailingAddr.AddressLine1 == "" || mailingAddr.Postcode == "" {
			log.Printf("record %d, mailing address is empty, not using it, email: %s, accountID: %s", i, email, custardID)
		} else {
			profile.Addresses = append(profile.Addresses, &mailingAddr)
		}

		billingAddr := proto.Address{
			AddressLine1:   record[billingStreet1Field],
			AddressLine2:   record[billingStreet2Field],
			City:           record[billingCityField],
			Province:       record[billingStateField],
			Country:        record[billingCountryField],
			Postcode:       record[billingPostalCodeField],
			Landline:       record[accountPhoneField],
			PrimaryAddress: false,
		}

		// Just try to re-use the mailing address if necessary
		if billingAddr.AddressLine1 == "" || billingAddr.Postcode == "" {
			billingAddr := mailingAddr
			billingAddr.PrimaryAddress = false
		}

		// Check ifit's still empty
		if billingAddr.AddressLine1 == "" || billingAddr.Postcode == "" {
			log.Printf("record %d, mailing address is empty, not using, email: %s, accountID: %s", i, email, custardID)
		} else {
			profile.Addresses = append(profile.Addresses, &billingAddr)
		}

		md := metadata.Pairs(server.AuthDexKey, dexID)
		ctx := metadata.NewContext(ctx, md)

		log.Printf("record %d, creating user, email: %s, dexID: %s", i, email, dexID)
		if !dryRun {
			_, err := asvc.CreateUser(ctx, &proto.CreateUserReq{
				Email: email,
				DexID: dexID,
			})
			if err != nil {
				return fmt.Errorf("error creating user: %s", err)
			}
		}

		log.Printf("record %d, creating account email: %s first/last: %s/%s", i, profile.Email, profile.FirstName, profile.LastName)
		var newAcctID string
		if dryRun {
			newAcctID = "fake-newAccountID-" + strconv.Itoa(i)
		} else {
			acctResp, err := asvc.CreateAccount(ctx, &proto.CreateAccountReq{
				Account: &proto.Account{
					Profile: profile,
				},
			})
			if err != nil {
				return fmt.Errorf("error creating account: %s", err)
			}
			acct := acctResp.GetAccount()
			newAcctID = acct.ID

		}
		log.Printf("record %d, created account, accountID: %s", i, newAcctID)
		m := accountMapping{
			CustardID: custardID,
			BFID:      newAcctID,
		}
		log.Printf("mapping: %+v", m)
		err = mappingEncoder.Encode(&m)
		if err != nil {
			return fmt.Errorf("error saving custardID to bfID mapping:  %s", err)
		}

		quayID := record[quayIDField]
		quayToken := robotNameToToken[quayID]
		if quayID == "" {
			log.Printf("record %d, quayID for %s is empty, not setting quay credentials", i, newAcctID)
		} else {
			log.Printf("record %d, setting quay credentials for %s, quayID: %s", i, newAcctID, quayID)
			if !dryRun {
				_, err = asvc.SetQuayCredentials(ctx, &proto.SetQuayCredentialsReq{
					AccountID: newAcctID,
					QuayID:    quayID,
					QuayToken: quayToken,
				})
				if err != nil {
					return fmt.Errorf("unable to set quay credentials account %s, err: %s", newAcctID, err)
				}
			}
		}

		cardID := record[stripeCardIDField]
		customerID := record[stripeCustomerIDField]
		if cardID != "" && customerID != "" {
			log.Printf("record %d, creating payment method with customerID: %s, cardID: %s", i, customerID, cardID)
			if !dryRun {
				captureReq := &models.StripeAuthCaptureRequest{
					CardID:     swag.String(cardID),
					CustomerID: swag.String(customerID),
				}
				captureReq.SetAccountID(swag.String(newAcctID))
				captureReq.SetGateway(swag.String("Stripe"))
				captureReq.SetDefaultPaymentMethod(swag.Bool(true))
				captureResp, err := bfClient.Tokenization.AuthCapture(&tokenization.AuthCaptureParams{
					AuthCaptureRequest: captureReq,
				})

				if err != nil {
					bfErr := err.(*tokenization.AuthCaptureDefault).Payload
					code := *bfErr.ErrorCode
					msg := *bfErr.ErrorMessage
					errType := *bfErr.ErrorType
					return fmt.Errorf("unable to create payment method, msg: %s, code %d, errType: %s", msg, code, errType)
				}
				if len(captureResp.Payload.Results) == 0 {
					return fmt.Errorf("Create Card: No payment method returned from BF API")
				}
			}
		} else {
			log.Printf("record %d, stripe cardID and/or customerID empty for account %s", i, newAcctID)
		}
		log.Println("------------------------------------------------------------")
	}

	return nil
}

func migratePurchases(ctx context.Context) error {
	csvFile, err := os.Open(purchasesCSV)
	if err != nil {
		return fmt.Errorf("unable to open file: %s", err)
	}
	defer csvFile.Close()

	mappingFile, err := os.Open(accountMappingFile)
	if err != nil {
		return fmt.Errorf("unable to open file: %s", err)
	}
	defer mappingFile.Close()

	mappingDecoder := json.NewDecoder(mappingFile)

	acctMapping := make(map[string]string)
	for mappingDecoder.More() {
		var m accountMapping
		err = mappingDecoder.Decode(&m)
		if err != nil {
			return fmt.Errorf("error decoding account mapping")
		}
		acctMapping[m.CustardID] = m.BFID
	}

	productsResp, err := asvc.ListProducts(ctx, &proto.ListProductsReq{
		IncludePrivate: true,
	})
	if err != nil {
		return fmt.Errorf("error getting products: %s", err)
	}

	products = make(map[string]*proto.Product)
	plans = make(map[string]*proto.RatePlan)
	for _, p := range productsResp.GetItems() {
		products[p.Name] = p
		rps := p.GetRatePlans()
		for _, rp := range rps {
			plans[rp.Name] = rp
		}
	}

	reader := csv.NewReader(csvFile)
	reader.Comma = '|'
	record, err := reader.Read()
	if err != nil {
		return fmt.Errorf("unable to read header fields from csv: %s", err)
	}

	headers := make(map[string]int)
	for i, col := range record {
		headers[col] = i
	}

	accountIDField := headers["account_id"]
	purchaseIDField := headers["purchase_id"]
	skuIDField := headers["sku_id"]
	dateField := headers["date"]
	billingStartField := headers["billing_start_date"]
	lastTransField := headers["last_transaction_created_at"]

	// i starts at 0
	var i int
	cur, err := getCursor(purchasesCursor)
	if err != nil {
		return fmt.Errorf("unable to get cursor")
	}
	log.Printf("got cursor. current position: %d", cur)

	// update i until we reach our cursor. the default cursor value is 0, for
	// no cursor
	for i != cur {
		reader.Read()
		i++
	}

	log.Println("------------------------------------------------------------")
	for {
		select {
		case <-ctx.Done():
			log.Printf("got stop signal, migrator stopping")
			return nil
		default:
		}

		// update i and save the cursor so that if we exit and start back
		// up we don't do the account again
		i++
		err = saveCursor(purchasesCursor, i)
		if err != nil {
			return fmt.Errorf("unable to save cursor to file: %s", err)
		}

		record, err = reader.Read()
		if err == io.EOF {
			break
		} else if err != nil {
			return fmt.Errorf("could not read record, err: %s", err)
		}

		custardID := record[accountIDField]
		newAcctID := acctMapping[custardID]
		log.Printf("record %d, custardID: %s, accountID: %s", i, custardID, newAcctID)
		if newAcctID == "" {
			log.Printf("record %d, accountID is empty, skipping", i)
			continue
		}

		purchaseID := record[purchaseIDField]
		skuID := record[skuIDField]
		purchaseDate := record[dateField]
		billingStart := record[billingStartField]
		lastTrans := record[lastTransField]

		log.Printf("record %d, creating subscription, custardID: %s, accountID %s", i, custardID, newAcctID)
		newSub, err := convertOldSub(newAcctID, purchaseID, skuID, billingStart, lastTrans, purchaseDate)
		if err != nil {
			err := fmt.Errorf("unable to convert old sub to new sub: %s", err)
			log.Printf("err!: %s", err)
			continue
		}
		log.Printf("new sub: %+v", newSub)
		if !dryRun {
			_, err = bfClient.Subscriptions.CreateSubscriptionV2(&subscriptions.CreateSubscriptionV2Params{
				Request: newSub,
			})
			if err != nil {
				bfErr := err.(*subscriptions.CreateSubscriptionV2Default).Payload
				code := *bfErr.ErrorCode
				msg := *bfErr.ErrorMessage
				errType := *bfErr.ErrorType
				return fmt.Errorf("unable to create subscription msg: %s, code %d, errType: %s", msg, code, errType)
			}
		}
		log.Println("------------------------------------------------------------")
	}
	return nil
}

func convertOldSub(acctID, purchaseID, skuID, billingStartStr, lastTransStr, purchaseDateStr string) (*models.CreateSubscriptionRequest, error) {
	var (
		productName string
		planName    string
		quantities  []*models.PricingComponentQuantityRequest
		subType     string
		subTrialEnd time.Time
	)

	lastTransactionUnix, err := strconv.ParseInt(lastTransStr, 10, 64)
	if err != nil {
		return nil, err
	}
	lastTransaction := time.Unix(lastTransactionUnix, 0)

	billingStartUnix, err := strconv.ParseInt(billingStartStr, 10, 64)
	if err != nil {
		return nil, err
	}
	billingStart := time.Unix(billingStartUnix, 0)

	purchaseDateUnix, err := strconv.ParseInt(purchaseDateStr, 10, 64)
	if err != nil {
		return nil, err
	}
	purchaseDate := strfmt.DateTime(time.Unix(purchaseDateUnix, 0))

	if lastTransactionUnix == 0 {
		// never been billed yet
		subType = "Trial"
		subTrialEnd = billingStart
	} else {
		subType = "Trial"
		// All existing plans are 30 days exactly. 2592000 is taken from our
		// billing period in custard
		thirtyDays := time.Duration(2592000) * time.Second
		nextBill := lastTransaction.Add(thirtyDays)
		// We set the trial end so that we can start the subscription
		// immediately, without actually billing them the cost.
		subTrialEnd = nextBill
	}

	now := time.Now()
	var trialEnd *strfmt.DateTime
	if !subTrialEnd.Before(now) {
		tmp := strfmt.DateTime(subTrialEnd)
		trialEnd = &tmp
	} else {
		subType = "Subscription"
		log.Printf("subscription trial end (%s) is before the current time (%s), not giving a trial", subTrialEnd, now)
	}

	if strings.Contains(skuID, "quay-enterprise") {
		productName = "quay-enterprise"
		n, err := fmt.Sscanf(skuID, "quay-enterprise-%s", &planName)
		if err != nil {
			return nil, err
		}
		if n != 1 {
			return nil, fmt.Errorf("expected 1 value got %d ", n)
		}
	} else if strings.Contains(skuID, "premium-managed-linux") {
		productName = "premium-managed-linux"
		planName = "premium-managed-linux-legacy"
		var numServers int64
		n, err := fmt.Sscanf(skuID, "premium-managed-linux-%d-servers", &numServers)
		if err != nil {
			return nil, err
		}
		if n != 1 {
			return nil, fmt.Errorf("expected 1 value got %d ", n)
		}

		quantities = append(quantities, &models.PricingComponentQuantityRequest{
			PricingComponent: "support.coreoslinux.server-count",
			Quantity:         numServers,
		})
	} else {
		return nil, fmt.Errorf("unknown skuID: %s", skuID)
	}

	product, ok := products[productName]
	if !ok {
		return nil, fmt.Errorf("unable to find product of name %s", productName)
	}
	plan, ok := plans[planName]
	if !ok {
		return nil, fmt.Errorf("unable to find plan of name %s", planName)
	}

	return &models.CreateSubscriptionRequest{
		AccountID:       acctID,
		Product:         product.ID,
		ProductRatePlan: plan.ID,
		State:           swag.String("Provisioned"),
		PricingComponentQuantities: quantities,
		Type:          swag.String(subType),
		ContractStart: &purchaseDate,
		TrialEnd:      trialEnd,
		AlignPeriodWithAggregatingSubscription: swag.Bool(true),
		Metadata: models.DynamicMetadata{
			"agreedTOS":                 true,
			"bypassPaymentVerification": false,
			"paymentType":               "CreditCard",
		},
	}, nil
}

func saveCursor(cursor string, i int) error {
	cursorFile, err := os.OpenFile(cursor, os.O_RDWR|os.O_CREATE|os.O_EXCL, 0666)
	if os.IsExist(err) {
		cursorFile, err = os.OpenFile(cursor, os.O_RDWR, 0666)
	}
	if err != nil {
		return err
	}
	defer cursorFile.Close()
	_, err = cursorFile.WriteString(strconv.Itoa(i))
	if err != nil {
		return err
	}
	err = cursorFile.Sync()
	return err
}

func getCursor(cursor string) (int, error) {
	b, err := ioutil.ReadFile(cursor)
	if os.IsNotExist(err) {
		return 0, nil
	}
	if err != nil {
		return 0, err
	}
	i, err := strconv.Atoi(string(b))
	if err != nil {
		return 0, err
	}
	return i, nil
}

type accountMapping struct {
	CustardID string
	BFID      string
}

type robotAuth struct {
	Token string `json:"token"`
	Name  string `json:"name"`
}
