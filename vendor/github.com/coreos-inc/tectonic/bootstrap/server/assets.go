package server

import (
	"archive/zip"
	"bytes"
	"net/http"
	"path/filepath"
	"time"

	"golang.org/x/net/context"

	"github.com/coreos-inc/tectonic/bootstrap/server/asset"
	"github.com/coreos-inc/tectonic/bootstrap/server/ctxh"
)

// assetsHandler serves zipped assets for created clusters.
func assetsHandler(s Store) ctxh.ContextHandler {
	fn := func(ctx context.Context, w http.ResponseWriter, req *http.Request) *ctxh.AppError {
		cluster, ok := s.GetCluster("bootkube")
		if !ok {
			return ctxh.NewAppError(nil, "No cluster has been created", http.StatusNotFound)
		}
		if assets := cluster.GetAssets(); assets != nil {
			zipAssetHandler(assets).ServeHTTP(ctx, w, req)
		}
		return nil
	}
	return ctxh.ContextHandlerFuncWithError(fn)
}

// zipAssetHandler returns a ContextHandler that writes assets to a zip file
// and serves a download response.
func zipAssetHandler(assets []asset.Asset) ctxh.ContextHandler {
	fn := func(ctx context.Context, w http.ResponseWriter, req *http.Request) *ctxh.AppError {
		// Create a buffer to write the zip archive to
		buf := new(bytes.Buffer)
		// Create a zip archive Writer
		zw := zip.NewWriter(buf)
		// Add asset files to the archive
		for _, asset := range assets {
			f, err := zw.Create(filepath.Join("assets", asset.Name()))
			if err != nil {
				return ctxh.NewAppError(err, "Cannot add file to zip", http.StatusInternalServerError)
			}
			_, err = f.Write(asset.Data())
			if err != nil {
				return ctxh.NewAppError(err, "Cannot write data to file", http.StatusInternalServerError)
			}
		}
		// Close the archive
		err := zw.Close()
		if err != nil {
			return ctxh.NewAppError(err, "Cannot close zip.Writer", http.StatusInternalServerError)
		}
		w.Header().Set("Content-Type", "application/zip")
		w.Header().Set("Content-Disposition", "attachment; filename=\"assets.zip\"")
		http.ServeContent(w, req, "assets.zip", time.Now(), bytes.NewReader(buf.Bytes()))
		return nil
	}
	return ctxh.ContextHandlerFuncWithError(fn)
}
