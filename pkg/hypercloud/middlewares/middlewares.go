package middlewares

import (
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

func test(rw http.ResponseWriter, r *http.Request, next http.HandlerFunc) {
	next(rw, r)
}
