package engine

// CalculateVerdict evaluates the raw severity score (1-10) and assigns the appropriate action.
func CalculateVerdict(target, targetType string, severity int, category ThreatCategory, name, reason string, matchedTier int, entropy, confidence float64) ThreatVerdict {
	if severity < 1 {
		severity = 1
	} else if severity > 10 {
		severity = 10
	}

	var action ThreatAction
	switch {
	case severity >= 8:
		action = ActionAutoBlock
	case severity >= 4:
		action = ActionQueueUser
	default:
		action = ActionAllow
	}

	return ThreatVerdict{
		Target:      target,
		TargetType:  targetType,
		Severity:    severity,
		Action:      action,
		Category:    category,
		ThreatName:  name,
		Reason:      reason,
		MatchedTier: matchedTier,
		Entropy:     entropy,
		Confidence:  confidence,
	}
}
