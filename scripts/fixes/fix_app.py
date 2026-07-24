import re

content = open('src/App.tsx').read()
content = content.replace("import { DetailModal } from './components/DetailModal';", "import { UniversalMediaDetailView } from './components/UniversalMediaDetailView';")

detail_modal_str = """        <DetailModal
          media={selectedMedia}
          onClose={() => setSelectedMedia(null)}
          onStartPlayback={handleStartPlayback}
        />"""

universal_modal_str = """        {selectedMedia && (
          <UniversalMediaDetailView
            mediaId={selectedMedia.id}
            mediaType={(selectedMedia as any).mediaType || 'movie'}
            onClose={() => setSelectedMedia(null)}
            onPlay={(media, startPosition) => {
              // Map back to handleStartPlayback
              handleStartPlayback(selectedMedia, selectedMedia.streams[0], startPosition || 0);
            }}
          />
        )}"""

content = content.replace(detail_modal_str, universal_modal_str)
open('src/App.tsx', 'w').write(content)
