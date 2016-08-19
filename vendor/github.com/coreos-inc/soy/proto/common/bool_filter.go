package common

func GetBoolPtr(f BoolFilter) (b *bool) {
	var tmp bool
	switch f {
	case BoolFilter_TRUE:
		tmp = true
		b = &tmp
	case BoolFilter_FALSE:
		b = &tmp
	case BoolFilter_ALL:
		b = nil
	}
	return
}

func GetBoolFilter(b *bool) (f BoolFilter) {
	if b == nil {
		f = BoolFilter_ALL
	} else {
		if *b {
			f = BoolFilter_TRUE
		} else {
			f = BoolFilter_FALSE
		}
	}
	return
}
