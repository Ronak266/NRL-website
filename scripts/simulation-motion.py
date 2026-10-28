"""Reversible fixture-based service order for the studio film."""
def service_stage(part):
    if part.get('hardware'): return .02,.17
    return {'wiring':(.20,.34),'electronics':(.38,.52),'mechanism':(.56,.70),'drive':(.74,.86),'frame':(.88,1.)}.get(part['system'],(.56,.70))
def separation(time):
    if time<1: return 0.
    if time<6: return (time-1)/5
    if time<12: return 1.
    if time<17: return 1-(time-12)/5
    return 0.
def progress(part,amount):
    start,end=service_stage(part);t=max(0,min(1,(amount-start)/(end-start)))
    return t*t*(3-2*t)

def wire_layout(part,index,count):
    """Preserve cable length and thickness in a straight, evenly spaced rack."""
    import math
    centers=[[sum(v[j] for v in part['v'][k:k+8])/8 for j in range(3)] for k in range(0,len(part['v']),8)]
    distances=[0.]
    for a,b in zip(centers,centers[1:]):distances.append(distances[-1]+math.dist(a,b))
    x=(index-(count-1)/2)*.23
    return [[x+.018*math.cos(k%8*math.tau/8),3.25+distances[k//8],-.25+.018*math.sin(k%8*math.tau/8)] for k in range(len(part['v']))]
