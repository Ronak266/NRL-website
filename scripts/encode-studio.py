"""Encode the local ray-traced sequence; retain all three six-second chapters."""
import subprocess
from pathlib import Path
root=Path(__file__).resolve().parents[1]
subprocess.run(['ffmpeg','-y','-v','error','-framerate','8','-t','18','-i',str(root/'dist/studio-frames/%04d.ppm'),'-vf','tpad=stop_mode=clone:stop_duration=0.25,minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc:vsbmc=1','-t','18','-an','-c:v','libx264','-preset','medium','-crf','21','-pix_fmt','yuv420p','-movflags','+faststart',str(root/'assets/forge-simulation.mp4')],check=True)
subprocess.run(['ffmpeg','-y','-v','error','-i',str(root/'dist/studio-frames/0000.ppm'),'-q:v','2',str(root/'assets/simulation-poster.jpg')],check=True)
