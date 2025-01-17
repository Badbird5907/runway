"use client";

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { cn } from "@/lib/utils";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Plus } from "lucide-react";
import React from "react";
import { useState } from "react";

const DraggablePage = ({ id, index }: { id: string; index: number }) => {
  return (
    <Draggable draggableId={id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="w-full h-full"
        >
          <div className={cn(
            "w-full h-full bg-slate-500 box-border border-2 border-black items-center justify-center flex flex-col",
            "border-t-0 border-l-0"
          )}>
            <h1 className="text-center text-white text-2xl font-bold">{id}</h1>
          </div>
        </div>
      )}
    </Draggable>
  );
};

const Column = ({ columnId, pages }: { columnId: string; pages: string[] }) => {
  return (
    <Droppable droppableId={columnId}>
      {(provided) => (
        <ResizablePanel>
          <div className="flex flex-col w-full h-full border-2 border-dashed border-gray-300" ref={provided.innerRef}>
            <ResizablePanelGroup direction="vertical">
              {pages.map((pageId, index) => (
                <React.Fragment key={pageId}>
                  <ResizablePanel>
                    <DraggablePage id={pageId} index={index} />
                  </ResizablePanel>
                  {pages.length >= 2 && index < pages.length - 1 && (
                    <ResizableHandle />
                  )}
                </React.Fragment>
              ))}
              {provided.placeholder}
            </ResizablePanelGroup>
          </div>
        </ResizablePanel>
      )}
    </Droppable>
  );
};

export default function TestPage() {
  const [columns, setColumns] = useState<{ [key: string]: string[] }>({
    'column-1': ['1'],
    'column-2': ['2', '2.1', '2.2'],
    'column-3': ['3'],
  });

  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result;

    if (!destination) return;

    // same column move
    if (source.droppableId === destination.droppableId) {
      const column = [...columns[source.droppableId]];
      const [removed] = column.splice(source.index, 1);
      column.splice(destination.index, 0, removed);

      setColumns({
        ...columns,
        [source.droppableId]: column,
      });
      return;
    }

    // col to col
    const sourceColumn = [...columns[source.droppableId]];
    const destColumn = [...columns[destination.droppableId]];
    const [moved] = sourceColumn.splice(source.index, 1);
    destColumn.splice(destination.index, 0, moved);

    setColumns({
      ...columns,
      [source.droppableId]: sourceColumn,
      [destination.droppableId]: destColumn,
    })
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex flex-row h-screen p-4">
        <ResizablePanelGroup direction="horizontal">
          {Object.entries(columns).map(([columnId, pages], index) => (
            <React.Fragment key={columnId}>
              <Column key={columnId} columnId={columnId} pages={pages} />
              {index < Object.keys(columns).length - 1 && <ResizableHandle withHandle />}
            </React.Fragment>
          ))}
          <div className="flex flex-col gap-4 h-full pl-4">
            <button className="flex items-center justify-center w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg ml-auto"
              onClick={() => {
                const newColumnId = `column-${Object.keys(columns).length + 1}`;
                setColumns({
                  ...columns,
                  [newColumnId]: [],
                });
              }}>
              <Plus className="w-10 h-10" />
            </button>
          </div>
        </ResizablePanelGroup>
      </div>
    </DragDropContext>
  );
}