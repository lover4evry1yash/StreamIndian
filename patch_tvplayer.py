import sys

with open('src/components/TVPlayer.tsx', 'r') as f:
    content = f.read()

content = content.replace(
"""      playbackManager.stop();
    };""",
"""      playbackManager.stop();
      playbackManager.clearVideoContainer();
    };""")

with open('src/components/TVPlayer.tsx', 'w') as f:
    f.write(content)
