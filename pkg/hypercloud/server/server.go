package server

import (
	"context"
	"crypto/tls"
	"net/http"

	"github.com/openshift/console/pkg/config/dynamic"
	"github.com/openshift/console/pkg/crypto"
	_ "github.com/openshift/console/pkg/hypercloud/middlewares"
	_ "github.com/openshift/console/pkg/provider"
	_ "github.com/openshift/console/pkg/provider/file"
	"github.com/openshift/console/pkg/server"
	log "github.com/sirupsen/logrus"
	"github.com/traefik/traefik/safe"
	// pServer "github.com/openshift/console/pkg/hypercloud/proxy
)

type stoppableServer interface {
	Shutdown(ctx context.Context) error
	Close() error
	ListenAndServe() error
}
type HttpServer struct {
	Server   stoppableServer
	Switcher *HTTPHandlerSwitcher
	Conf     *dynamic.Configuration
}

// NewServer create Server from server.Server
func NewServer(srv *server.Server, tlsCa, tlsKey *string) (*HttpServer, error) {
	httpSwitcher := NewHandlerSwitcher(http.NotFoundHandler())
	var handler http.Handler
	handler = httpSwitcher

	listenURL := srv.BaseURL

	serverHTTP := &http.Server{
		Addr:         listenURL.Host,
		Handler:      handler,
		TLSNextProto: make(map[string]func(*http.Server, *tls.Conn, http.Handler)),
		TLSConfig: &tls.Config{
			CipherSuites: crypto.DefaultCiphers(),
		},
	}

	go func() {
		log.Infof("Binding to %s...", serverHTTP.Addr)
		if listenURL.Scheme == "https" {
			log.Info("using TLS")
			log.Fatal(serverHTTP.ListenAndServeTLS(*tlsCa, *tlsKey))
		} else {
			log.Info("not using TLS")
			log.Fatal(serverHTTP.ListenAndServe())
		}
	}()
	return &HttpServer{
		Server:   serverHTTP,
		Switcher: httpSwitcher,
	}, nil
}

func (s *HttpServer) Start(ctx context.Context) {
	logger := log.StandardLogger()
	logger.Info("Start Server")

	// var handler http.Handler
	// s.Switch(s.Handler.Switcher)
	// // s.Switch(rt *HTTPHandlerSwitcher)
	// // handler = s.Handler.Switcher.GetHandler()
	// handler = s.Handler.Switcher.GetHandler()
	// listenURL := s.Info.URL

	// httpsrv := &http.Server{
	// 	Addr:         listenURL.Host,
	// 	Handler:      handler,
	// 	TLSNextProto: make(map[string]func(*http.Server, *tls.Conn, http.Handler)),
	// 	TLSConfig: &tls.Config{
	// 		CipherSuites: crypto.DefaultCiphers(),
	// 	},
	// }

}

// func (s *Server) Stop() {

// }

// func (s *Server) Switch(rt *HTTPHandlerSwitcher) {
// 	httpHandler := rt.GetHandler()
// 	if httpHandler == nil {
// 		httpHandler = http.NotFoundHandler()
// 	}

// 	s.Handler.Switcher.UpdateHandler(httpHandler)

// }

// // Start server
// func (s *Server) Start() {
// 	// s.Watcher.Start()
// 	log.Info("call server start")
// 	// go s.RunServer()
// 	// s.Count = s.Count + 1
// 	// s.A = s.A
// }

// func (s *Server) RunServer() {

// 	for {
// 		// config := <-s.Watcher.configChan
// 		log.Info("call Run Server")

// 		// _ = s.buildHandler(config)
// 		// data, err := json.Marshal(&r)
// 		// if err != nil {
// 		// 	log.Debugf("error : %v", err)
// 		// }
// 		// s.Channel <- data
// 	}

// }

// func (s *Server) buildHandler(config dynamic.Message) *router.Router {
// 	// config := <-s.Watcher.configChan
// 	// handlers := map[string]*http.Handler{}
// 	routerTemp, err := router.NewRouter()
// 	if err != nil {
// 		log.Info("Failed to create router ", err)
// 		// return nil, err
// 	}
// 	log.Info("buildHandler :  ", config.Configuration.Routers)
// 	for name, value := range config.Configuration.Routers {
// 		log.Info("Creating proxy backend based on  :  ", name, value)
// 		proxyBackend, err := backend.NewBackend(name, value.Server)
// 		if err != nil {
// 			log.Error("Failed to parse url of server")
// 			// return nil, err
// 		}
// 		proxyBackend.Rule = value.Rule
// 		proxyBackend.ServerURL = value.Server
// 		if value.Path != "" {
// 			handlerConfig := &pConfig.StripPrefix{
// 				Prefixes: []string{value.Path},
// 			}
// 			prefixHandler, err := stripprefix.New(context.TODO(), proxyBackend.Handler, *handlerConfig, "stripPrefix")
// 			if err != nil {
// 				log.Error("Failed to create stripPrefix handler", err)
// 				// return nil, err
// 			}
// 			err = routerTemp.AddRoute(proxyBackend.Rule, 0, prefixHandler)
// 			if err != nil {
// 				log.Error("failed to put proxy handler into Router", err)
// 				// return nil, err
// 			}
// 		}
// 		err = routerTemp.AddRoute(proxyBackend.Rule, 0, proxyBackend.Handler)
// 		if err != nil {
// 			log.Error("failed to put proxy handler into Router ", err)
// 			// return nil, err
// 		}
// 	}
// 	go func() {
// 		s := http.Server{
// 			Addr:    "localhost:9090",
// 			Handler: routerTemp,
// 		}
// 		s.ListenAndServe()
// 	}()

// 	// go func() {
// 	// 	b := http.Server{
// 	// 		Addr: "localhost:9091",
// 	// 		// Handler: s.A,
// 	// 	}
// 	// 	b.ListenAndServe()
// 	// }()
// 	// return router, nil
// 	return routerTemp
// }

// func (s *Server) runDynamic() {
// 	for {
// 		config := <-s.Watcher.configChan
// 		log.Info("run dynamic func to change router beside config")
// 		newR, err := s.buildHandler(config)
// 		if err != nil {
// 			log.Error("failed to get router", err)
// 		}
// 		log.Info("========End to Creating router=========")
// 		// s.Server = newRoute
// 	}

// }

// type Server struct {
// 	httpServer *http.Server
// 	*viper.Viper
// }

// func ShutdownServer(ctx context.Context) {
// 	server.httpServer.Shutdown(ctx)
// 	ctx.Done()
// }

// func StartServer(ctx context.Context) {
// 	pRouter := &Proxy{}
// 	router := pRouter.ProxyRouter()

// 	httpServer := &http.Server{
// 		Handler: router,
// 	}
// 	server = &Server{
// 		httpServer: httpServer,
// 	}

// 	test := &file.Provider{
// 		Filename: "yyy",
// 		Watch:    true,
// 	}

// 	test1 := NewWatcher(test)
// 	test1.Start()

// 	_ = <-test1.configChan

// 	// if err := server.httpServer.ListenAndServe(); err != nil {
// 	// 	log.Fatal("StartServer: starting server failed with %s", err)
// 	// }

// 	// router := pRouter.ProxyRouter()
// 	// proxyRouter :=
// }

// func (s *Server) WatchConfig(change chan int) {
// 	// viper.AddRemoteProvider(provider string, endpoint string, path string)
// 	viper.WatchConfig()
// 	viper.OnConfigChange(func(in fsnotify.Event) {
// 		fmt.Println(in.Name)
// 		change <- 1
// 	})
// }

// func (s *Server) RunServer() {

// }

// // // This code is based on Weaver
// // var server *Console

// // type Console struct {
// // 	httpServer *http.Server
// // }

// // func ShutdownServer(ctx context.Context) {
// // 	server.httpServer.Shutdown(ctx)
// // }

// // func (c *Console) StartServer(ctx context.Context, provider provider.Provider) {

// // 	httpServer := http.Server{
// // 		Addr:    ":8000",
// // 		Handler: proxy,
// // 	}
// // 	pSrv := &pServer.Proxy{}
// // 	if *fProxyConfig != "" {
// // 		if err := pSrv.SetFlagsFromConfig(*fProxyConfig); err != nil {
// // 			log.Fatalf("Failed to load proxy config: %v", err)
// // 		}
// // 		log.Info(pSrv)
// // 		for i, val := range pSrv.ProxyInfo {
// // 			log.Infof("test", i, val)
// // 		}

// // 	}
// // 	router := pSrv.ProxyRouter()
// // 	router.AddRoute("PathPrefix(`/`)", 1, srv.HTTPHandler())
// // 	n := negroni.Classic()
// // 	n.UseHandler(router.Router)

// // 	httpsrv := &http.Server{
// // 		Addr:    listenURL.Host,
// // 		Handler: n,
// // 		// Disable HTTP/2, which breaks WebSockets.
// // 		TLSNextProto: make(map[string]func(*http.Server, *tls.Conn, http.Handler)),
// // 		TLSConfig: &tls.Config{
// // 			CipherSuites: crypto.DefaultCiphers(),
// // 		},
// // 	}
// // }

// //Server is the reverse-proxy
// // type Server struct {
// // 	watcher                *ConfigurationWatcher
// // 	configFromListenerChan chan dynamic.Configuration

// // 	signals  chan os.Signal
// // 	stopChan chan bool

// // 	routinesPool *safe.Pool

// // 	// console *Console

// // }

// // func NewServer(routinesPool *safe.Pool, watcher *ConfigurationWatcher, httpServer ) *Server {
// // 	srv := &Server{
// // 		watcher:      watcher,
// // 		signals:      make(chan os.Signal, 1),
// // 		stopChan:     make(chan bool, 1),
// // 		routinesPool: routinesPool,
// // 	}

// // 	srv.configureSignals()

// // 	return srv
// // }

// // // Start starts the server and Stop/Close it when context is Done.
// // func (s *Server) Start(ctx context.Context) {
// // 	go func() {
// // 		<-ctx.Done()
// // 		logger := tlog.FromContext(ctx)
// // 		logger.Info("I have to go...")
// // 		logger.Info("Stopping server gracefully")
// // 		s.Stop()
// // 	}()

// // 	s.watcher.Start()

// // 	s.routinesPool.GoCtx(s.listenSignals)
// // }

// // // Wait blocks until the server shutdown.
// // func (s *Server) Wait() {
// // 	<-s.stopChan
// // }

// // // Stop stops the server.
// // func (s *Server) Stop() {
// // 	defer tlog.WithoutContext().Info("Server stopped")

// // 	s.stopChan <- true
// // }
// // func (s *Server) Close() {
// 	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)

// 	go func(ctx context.Context) {
// 		<-ctx.Done()
// 		if errors.Is(ctx.Err(), context.Canceled) {
// 			return
// 		} else if errors.Is(ctx.Err(), context.DeadlineExceeded) {
// 			panic("Timeout while stopping traefik, killing instance ✝")
// 		}
// 	}(ctx)

// 	// stopMetricsClients()

// 	s.routinesPool.Stop()

// 	signal.Stop(s.signals)
// 	close(s.signals)

// 	close(s.stopChan)

// 	// s.chainBuilder.Close()

// 	cancel()
// }

// func (s *Server) SwitchRouter() func(config dynamic.Configuration) {
// 	return func(config dynamic.Configuration) {
// 		log.Info("----switchRouter called---")
// 		s.Info.URL.Host = "test"
// 	}
// }

type HTTPHandlerSwitcher struct {
	handler *safe.Safe
}

// NewHandlerSwitcher builds a new instance of HTTPHandlerSwitcher.
func NewHandlerSwitcher(newHandler http.Handler) (hs *HTTPHandlerSwitcher) {
	return &HTTPHandlerSwitcher{
		handler: safe.New(newHandler),
	}
}

func (h *HTTPHandlerSwitcher) ServeHTTP(rw http.ResponseWriter, req *http.Request) {
	handlerBackup := h.handler.Get().(http.Handler)
	handlerBackup.ServeHTTP(rw, req)
}

// GetHandler returns the current http.ServeMux.
func (h *HTTPHandlerSwitcher) GetHandler() (newHandler http.Handler) {
	handler := h.handler.Get().(http.Handler)
	return handler
}

// UpdateHandler safely updates the current http.ServeMux with a new one.
func (h *HTTPHandlerSwitcher) UpdateHandler(newHandler http.Handler) {
	h.handler.Set(newHandler)
}
