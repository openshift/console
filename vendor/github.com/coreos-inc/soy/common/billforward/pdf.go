package billforward

import (
	"bytes"
	"io"
	"io/ioutil"

	"github.com/go-openapi/runtime"
)

var PDFConsumer = runtime.ConsumerFunc(func(r io.Reader, data interface{}) error {
	f := data.(*runtime.File)
	b, err := ioutil.ReadAll(r)
	if err != nil {
		return err
	}
	f.Data = &ReadWrapper{bytes.NewReader(b)}
	return nil
})

type ReadWrapper struct {
	*bytes.Reader
}

func (r *ReadWrapper) Close() error {
	return nil
}
