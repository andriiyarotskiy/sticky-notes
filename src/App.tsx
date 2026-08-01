import Canvas from './components/notes/Canvas'
import { NotesProvider } from './context/NotesProvider'
import './App.css'

function App() {
  return (
    <NotesProvider>
      <div className="app">
        <Canvas />
      </div>
    </NotesProvider>
  )
}

export default App
