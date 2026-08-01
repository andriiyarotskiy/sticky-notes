import Canvas from "./components/Canvas/Canvas"
import { NotesProvider } from "./context/notes/Provider"

function StickyNotesBoard() {
  return (
    <NotesProvider>
      <Canvas />
    </NotesProvider>
  )
}

export default StickyNotesBoard
