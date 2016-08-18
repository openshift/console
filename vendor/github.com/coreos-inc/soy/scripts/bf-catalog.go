package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"time"

	"github.com/mitchellh/mapstructure"
	"github.com/spf13/cobra"
)

const ()

var (
	billforwardAPIKey   string
	billforwardEndpoint string
	bearerToken         string
	baseURL             string
	createProductFirst  bool

	client = http.DefaultClient

	rootCmd *cobra.Command = &cobra.Command{
		Use: "bf-catalog [command]",
	}
	createUnitsCmd *cobra.Command = &cobra.Command{
		Use: "create-units [units.json]",
		Run: createUnits,
	}
	createProductCmd *cobra.Command = &cobra.Command{
		Use: "create-product [product.json]",
		Run: createProduct,
	}
	createRatePlansCmd *cobra.Command = &cobra.Command{
		Use: "create-rate-plans [product.json] [rate-plan.json] [rate-plan2.json] ...",
		Run: createRatePlans,
	}
	resetBFCmd *cobra.Command = &cobra.Command{
		Use: "reset-bf",
		Run: resetBF,
	}
)

func init() {
	rootCmd.PersistentFlags().StringVar(&billforwardAPIKey, "billforward-api-key", "", "Billforward API key")
	rootCmd.PersistentFlags().StringVar(&billforwardEndpoint, "billforward-endpoint", "", "Billforward API key")

	createRatePlansCmd.Flags().BoolVar(&createProductFirst, "create-product", false, "Create the product for these rate plans first")

	rootCmd.AddCommand(createUnitsCmd)
	rootCmd.AddCommand(createProductCmd)
	rootCmd.AddCommand(createRatePlansCmd)
	rootCmd.AddCommand(resetBFCmd)
}

func initializeConfig() {
	if billforwardAPIKey == "" {
		billforwardAPIKey = os.Getenv("BILLFORWARD_API_KEY")
	}
	if billforwardAPIKey == "" {
		log.Fatal("must set either --billforward-api-key or $BILLFORWARD_API_KEY")
	}

	bearerToken = fmt.Sprintf("Bearer %s", billforwardAPIKey)

	if billforwardEndpoint == "" {
		billforwardEndpoint = os.Getenv("BILLFORWARD_ENDPOINT")
	}
	if billforwardEndpoint == "" {
		log.Fatal("must set either --billforward-endpoint or $BILLFORWARD_ENDPOINT")
	}

	baseURL = billforwardEndpoint + "%s"
	log.Printf("using '%s' as billforward URL", billforwardEndpoint)
}

func main() {
	rootCmd.ParseFlags(os.Args[1:])
	initializeConfig()
	rootCmd.Execute()
}

func createUnits(cmd *cobra.Command, args []string) {
	if len(args) != 1 {
		log.Fatal("must provide a unit of measure file")
	}

	// create our units of measure in billforward
	newUnitsList := unmarshalFile(args[0])["units"]
	var newUnits []struct {
		Name        string `json:"name"`
		DisplayedAs string `json:"displayedAs"`
	}
	decode(newUnitsList, &newUnits)
	for _, unit := range newUnits {
		newUnit := newRequest("units-of-measure", "POST", marshal(unit))
		log.Println(do(newUnit))
	}
}

func createProduct(cmd *cobra.Command, args []string) {
	if len(args) != 1 {
		log.Fatal("must provide a product file")
	}
	product := unmarshalFile(args[0])
	metadata := product["metadata"]
	delete(product, "metadata")

	log.Println(do(newRequest("products", "POST", marshal(product))))
	productResp := do(newRequest(fmt.Sprintf("products/%s", product["name"]), "GET", nil))
	productID := productResp["results"].([]interface{})[0].(map[string]interface{})["id"]
	log.Println("productID:", productID)
	log.Println(do(newRequest(fmt.Sprintf("products/%s/metadata", productID), "PUT", marshal(metadata))))
}

func createRatePlans(cmd *cobra.Command, args []string) {
	if len(args) < 2 {
		log.Fatal("must provide a product file and at least one rate plan file")
	}

	if createProductFirst {
		createProduct(cmd, args[:1])
	}

	// query the units back to get a mapping of {unit-name: unit-id}
	getUnits := newRequest("units-of-measure", "GET", nil)
	fullUnits := do(getUnits)["results"]
	var unitResults []struct {
		Name string
		ID   string
	}
	decode(fullUnits, &unitResults)
	unitsIDMap := make(map[string]string)
	for _, unit := range unitResults {
		unitsIDMap[unit.Name] = unit.ID
	}

	productFull := unmarshalFile(args[0])
	productName := productFull["name"].(string)

	productResults := do(newRequest(fmt.Sprintf("products/%s", productName), "GET", nil))["results"].([]interface{})
	product := productResults[0].(map[string]interface{})
	productID := product["id"].(string)

	ratePlans := make([]map[string]interface{}, len(args[1:]))
	for i, rpPath := range args[1:] {
		rpFull := unmarshalFile(rpPath)
		ratePlans[i] = rpFull
	}

	for _, rp := range ratePlans {
		createRatePlan(productID, rp, unitsIDMap)
	}
}

func createRatePlan(productID string, ratePlan map[string]interface{}, unitsIDMap map[string]string) {
	pricingComponents := ratePlan["pricingComponents"].([]interface{})
	for _, pc := range pricingComponents {
		newPC := pc.(map[string]interface{})
		// Substitute unitOfMeasure for unitOfMeasureID
		unitName := newPC["unitOfMeasure"].(map[string]interface{})["name"].(string)
		newPC["unitOfMeasureID"] = unitsIDMap[unitName]
		delete(newPC, "unitOfMeasure")
	}

	ratePlan["productID"] = productID

	metadata := ratePlan["metadata"]
	delete(ratePlan, "metadata")

	log.Println(do(newRequest("product-rate-plans", "POST", marshal(ratePlan))))
	ratePlanResp := do(newRequest(fmt.Sprintf("product-rate-plans/%s", ratePlan["name"]), "GET", nil))
	ratePlanID := ratePlanResp["results"].([]interface{})[0].(map[string]interface{})["id"]
	log.Println("ratePlanID:", ratePlanID)
	log.Println(do(newRequest(fmt.Sprintf("product-rate-plans/%s/metadata", ratePlanID), "PUT", marshal(metadata))))
}

func resetBF(cmd *cobra.Command, args []string) {
	ratePlans := do(newRequest("product-rate-plans", "GET", nil))
	for _, rp := range ratePlans["results"].([]interface{}) {
		rp2 := rp.(map[string]interface{})
		if rp2["name"] == "aggregating-monthly" {
			log.Printf("not reseting aggregating monthly rate plan")
			continue
		}
		// rename
		rp2["name"] = fmt.Sprintf("%s_%d", rp2["name"], time.Now().Unix())
		// update so we can re-use old name
		log.Println(do(newRequest("product-rate-plans", "PUT", marshal(rp2))))
		// then delete
		log.Println(do(newRequest(fmt.Sprintf("product-rate-plans/%s", rp2["id"]), "DELETE", nil)))
	}

	products := do(newRequest("products", "GET", nil))
	for _, ps := range products["results"].([]interface{}) {
		ps2 := ps.(map[string]interface{})
		if ps2["name"] == "monthly-aggregating" {
			log.Printf("not reseting aggregating product")
			continue
		}
		ps2["name"] = fmt.Sprintf("%s_%d", ps2["name"], time.Now().Unix())
		log.Println(do(newRequest("products", "PUT", marshal(ps2))))
		log.Println(do(newRequest(fmt.Sprintf("products/%s", ps2["id"]), "DELETE", nil)))
	}
}

func do(req *http.Request) map[string]interface{} {
	resp, err := client.Do(req)
	if err != nil {
		log.Fatal(err)
	}
	return unmarshalResp(resp)
}

func newRequest(endpoint, method string, body io.Reader) *http.Request {
	u, err := url.Parse(fmt.Sprintf(baseURL, endpoint))
	if err != nil {
		log.Fatal(err)
	}
	v := url.Values{}
	v.Set("include_retired", "false")
	v.Set("records", "100")
	u.RawQuery = v.Encode()
	req, err := http.NewRequest(method, u.String(), body)
	if err != nil {
		log.Fatal(err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", bearerToken)
	return req
}

func decode(m interface{}, rawVal interface{}) {
	if err := mapstructure.Decode(m, rawVal); err != nil {
		log.Fatal(err)
	}
}

func mustOpen(filename string) *os.File {
	f, err := os.Open(filename)
	if err != nil {
		log.Fatal(err)
	}
	return f
}

func unmarshalFile(filename string) map[string]interface{} {
	f := mustOpen(filename)
	defer f.Close()
	return unmarshal(f)
}

func unmarshalResp(resp *http.Response) map[string]interface{} {
	defer resp.Body.Close()
	return unmarshal(resp.Body)
}

func unmarshal(r io.Reader) (v map[string]interface{}) {
	d := json.NewDecoder(r)
	d.UseNumber()
	if err := d.Decode(&v); err != nil {
		log.Fatal(err)
	}
	return
}

func marshal(v interface{}) io.Reader {
	var buf bytes.Buffer
	if err := json.NewEncoder(&buf).Encode(v); err != nil {
		log.Fatal(err)
	}
	return &buf
}
