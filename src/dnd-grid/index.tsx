import { DragDropContext, DropResult } from "@hello-pangea/dnd";

export const DndGridProvider = ({ children }: { children: React.ReactNode }) => {
  const handleDragEnd = (result: DropResult) => {
    console.log(result);
    if (result.reason === "CANCEL") {
      return;
    }
    
  };
  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      {children}
    </DragDropContext>
  )
}

