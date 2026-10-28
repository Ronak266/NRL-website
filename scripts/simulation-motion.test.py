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
if __name__=='__main__':unittest.main()
