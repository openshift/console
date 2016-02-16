package stats

type RecordRepo interface {
	Store(Record) error
}
