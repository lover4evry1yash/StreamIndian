import sys

with open('src/core/avplay.ts', 'r') as f:
    content = f.read()

if "public clearVideoContainer()" not in content:
    content = content.replace(
"""  public registerVideoContainer(element: HTMLVideoElement) {""",
"""  public clearVideoContainer() {
    this.videoElement = null;
  }

  public registerVideoContainer(element: HTMLVideoElement) {""")

with open('src/core/avplay.ts', 'w') as f:
    f.write(content)
