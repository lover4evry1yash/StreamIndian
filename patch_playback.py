import sys

with open('src/core/playback/PlaybackManager.ts', 'r') as f:
    content = f.read()

if "public clearVideoContainer()" not in content:
    content = content.replace(
"""  public registerVideoContainer(element: HTMLVideoElement) {
    this.avplayManager.registerVideoContainer(element);
  }""",
"""  public registerVideoContainer(element: HTMLVideoElement) {
    this.avplayManager.registerVideoContainer(element);
  }

  public clearVideoContainer() {
    this.avplayManager.clearVideoContainer();
  }""")

with open('src/core/playback/PlaybackManager.ts', 'w') as f:
    f.write(content)
