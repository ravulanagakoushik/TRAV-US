import { DeliveryStop, RiskLevel } from '../types/index.js';

export interface DeliveryRiskEvaluation {
  deliveryId: string;
  label: string;
  riskLevel: RiskLevel;
  estimatedArrivalAt: string;
  deadlineAt?: string;
  bufferMinutes?: number;
  factors: string[];
  recommendedAction: string;
}

/**
 * Rules-Based Delivery Delay & Risk Engine
 * Computes buffer margins against service windows and identifies delay bottlenecks.
 */
export function evaluateDeliveryRisks(
  stopsWithArrivals: {
    stop: DeliveryStop;
    estimatedArrivalAt: string;
    travelMinutesFromPrevious: number;
    sequenceNumber: number;
  }[],
  congestionMultiplier = 1.0
): DeliveryRiskEvaluation[] {
  const evaluations: DeliveryRiskEvaluation[] = [];

  for (const item of stopsWithArrivals) {
    const { stop, estimatedArrivalAt, travelMinutesFromPrevious, sequenceNumber } = item;
    const arrivalDate = new Date(estimatedArrivalAt);
    const factors: string[] = [];

    let riskLevel: RiskLevel = 'low';
    let bufferMinutes: number | undefined = undefined;
    let recommendedAction = 'Maintain scheduled route sequence.';

    if (stop.deadlineAt) {
      const deadlineDate = new Date(stop.deadlineAt);
      bufferMinutes = Math.round((deadlineDate.getTime() - arrivalDate.getTime()) / 60000);

      if (bufferMinutes < 0) {
        riskLevel = 'high';
        factors.push(
          `Delivery arrives ${Math.abs(bufferMinutes)} minutes AFTER customer deadline window.`
        );
        if (congestionMultiplier > 1.0) {
          factors.push(`Compounded by active road congestion multiplier (${congestionMultiplier}x).`);
        }
        if (sequenceNumber > 4) {
          factors.push(`Stop is sequence #${sequenceNumber}; cumulative service stops created delay buildup.`);
        }
        recommendedAction = 'Prioritize stop higher in route sequence or reassign to an earlier departing vehicle.';
      } else if (bufferMinutes <= 20) {
        riskLevel = 'medium';
        factors.push(`Narrow buffer margin: only ${bufferMinutes} minutes margin before deadline.`);
        if (travelMinutesFromPrevious > 25) {
          factors.push(`Lengthy ${travelMinutesFromPrevious}m transit leg from previous waypoint.`);
        }
        recommendedAction = 'Monitor live traffic on transit corridor; alert dispatch if transit slows.';
      } else {
        riskLevel = 'low';
        factors.push(`Comfortable buffer margin of ${bufferMinutes} minutes before deadline.`);
      }
    } else {
      riskLevel = 'low';
      factors.push('No hard customer deadline constraint specified for this delivery stop.');
    }

    evaluations.push({
      deliveryId: stop.id,
      label: stop.label,
      riskLevel,
      estimatedArrivalAt,
      deadlineAt: stop.deadlineAt,
      bufferMinutes,
      factors,
      recommendedAction,
    });
  }

  return evaluations;
}
