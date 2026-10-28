import importlib.util,unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('motion',Path(__file__).with_name('simulation-motion.py'));motion=importlib.util.module_from_spec(spec);spec.loader.exec_module(motion)
class MotionTests(unittest.TestCase):
 def test_cables_disconnect_before_structure_moves(self):
  wire={'system':'wiring'};frame={'system':'frame'}
  self.assertEqual(motion.progress(wire,.36),1)
  self.assertEqual(motion.progress(frame,.86),0)
 def test_fasteners_release_before_cables(self):
  self.assertEqual(motion.progress({'system':'frame','hardware':True},.19),1)
  self.assertEqual(motion.progress({'system':'wiring'},.19),0)
 def test_film_reverses_exactly_and_holds_at_both_ends(self):
  self.assertEqual(motion.separation(0),0);self.assertEqual(motion.separation(17.9),0)
  for i in range(101):
   x=i/100
   self.assertAlmostEqual(motion.separation(1+5*x),motion.separation(17-5*x))
 def test_wire_rack_is_parallel_spaced_and_preserves_cable_length(self):
  import json,math
  parts=json.loads((Path(__file__).parents[1]/'assets/robot.json').read_text())
  wires=[p for p in parts if p.get('wire')]
  layouts=[motion.wire_layout(p,i,len(wires)) for i,p in enumerate(wires)]
  xs=[]
  for part,layout in zip(wires,layouts):
   centers=[[sum(v[j] for v in layout[k:k+8])/8 for j in range(3)] for k in range(0,len(layout),8)]
   original=[[sum(v[j] for v in part['v'][k:k+8])/8 for j in range(3)] for k in range(0,len(part['v']),8)]
   length=sum(math.dist(a,b) for a,b in zip(original,original[1:]))
   self.assertAlmostEqual(centers[-1][1]-centers[0][1],length)
   self.assertGreaterEqual(centers[0][1],3.2)
   for c in centers:self.assertAlmostEqual(c[0],centers[0][0]);self.assertAlmostEqual(c[2],centers[0][2])
   xs.append(centers[0][0])
  for a,b in zip(xs,xs[1:]):self.assertAlmostEqual(b-a,.23)
if __name__=='__main__':unittest.main()
