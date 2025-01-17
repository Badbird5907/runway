// "use client"

// import { cn } from "@/lib/utils"
// import GridLayout from "react-grid-layout";

// const DraggablePage = ({ item }: { item: { id: string; x: number; y: number; w: number; h: number } }) => {
//   return (
//     <div className={cn(
//       "w-full h-full bg-slate-500 box-border border-2 border-black items-center justify-center flex flex-col",
//       "border-t-0 border-l-0"
//     )} data-grid={item}>
//       <h1 className="text-center text-white text-2xl font-bold">{item.id}</h1>
//     </div>
//   )
// }

// export default function GridPage() {
//   const layout = [
//     { id: '1', x: 0, y: 0, w: 1, h: 1 },
//     { id: '2', x: 1, y: 0, w: 1, h: 1 },
//     { id: '3', x: 2, y: 0, w: 1, h: 1 },
//   ]
//   return (
//     <GridLayout
//       cols={12}
//       rowHeight={30}
//       width={1200}
//       className="layout"
//     >
//       {layout.map((item) => (
//         <DraggablePage key={item.id} item={item} />
//       ))}
//     </GridLayout>
//   )

// }