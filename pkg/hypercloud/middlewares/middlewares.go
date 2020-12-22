package middlewares

import (
	"log"
	"net/http"

	"github.com/codegangsta/negroni"
	"golang.org/x/net/context"
)

type Builder struct {
	*negroni.Negroni
}

func NewBuilder()

func (b *Builder) BuilderChain(ctx context.Context, middlewares []string) *negroni.Negroni {
	n := negroni.Classic()
	n.Use(negroni.NewRecovery())

	// // for _, name := range middlewares {
	// // 	n.Use()
	// // }

	// con := &config.StripPrefix{
	// 	Prefixes: []string{"/test/"},
	// }

	// pre, _ := stripprefix.New(ctx, *con, "tata")
	// n.Use(pre)
	// // chain2.UseHandler()

	return n
}

type MiddleWare struct {

}

func (m *MiddleWare) SecurityHeadersMiddleware(hdlr http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Prevent MIME sniffing (https://en.wikipedia.org/wiki/Content_sniffing)
		w.Header().Set("X-Content-Type-Options", "nosniff")
		// Ancient weak protection against reflected XSS (equivalent to CSP no unsafe-inline)
		w.Header().Set("X-XSS-Protection", "1; mode=block")
		// Prevent clickjacking attacks involving iframes
		w.Header().Set("X-Frame-Options", "allowall")
		// Less information leakage about what domains we link to
		w.Header().Set("X-DNS-Prefetch-Control", "off")
		// Less information leakage about what domains we link to
		// w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		w.Header().Set("Referrer-Policy", "no-referrer-when-downgrade")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE, PATCH")
		// w.Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
		w.Header().Set("Access-Control-Allow-Headers", "*")
		hdlr.ServeHTTP(w, r)
	})
}

func (m *MiddleWare) LogRequest(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		negroni.Logger.Printf(r.RemoteAddr, r.Proto, , r.Method, r.URL.RequestURI()) 
		next.ServeHTTP(w, r)
	})

}
