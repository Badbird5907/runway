"use client";

import { cn } from "@/lib/utils";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { createContext, JSX, useContext } from "react";

const PageContext = createContext<{
  id: string;
} | { id: null }>({ id: null });
const DraggablePage = ({ id, subpages }: { id: string, subpages?: JSX.Element }) => {
  const pageContext = useContext(PageContext);
  const { id: parentId } = pageContext;
  return (
    <PageContext.Provider value={{ id }}>
      <div className={
        cn(
          "w-full h-full bg-slate-500 box-border border-2 border-black items-center justify-center flex flex-col",
          !!parentId && "border-x-0"
        )
      }>
        <h1 className="text-center text-white text-2xl font-bold">{id}</h1>
        {subpages}
      </div>
    </PageContext.Provider>
  )
}

export default function TestPage() {
  const handleDragEnd = (result: DropResult) => {
    console.log(result);
  }
  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex flex-row h-screen p-4">
        <DraggablePage id="1" />
        <DraggablePage id="2" subpages={(
          <>
            <DraggablePage id="2.1" />
            <DraggablePage id="2.2" />
          </>
        )} />
        <DraggablePage id="3" />
      </div>
    </DragDropContext>
  )
}