import os

files = [
    'src/core/providers/tvdb/TVDBClient.ts',
    'src/core/providers/tvdb/TVDBMapper.ts',
    'src/core/providers/tvdb/TVDBProvider.ts'
]

for f in files:
    content = open(f).read()
    # we are in src/core/providers/tvdb
    # ../../core/NetworkClient -> ../../NetworkClient
    content = content.replace("../../core/", "../../")
    open(f, 'w').write(content)

print("Done")
