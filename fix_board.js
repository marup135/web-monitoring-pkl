const fs = require('fs');
const path = require('path');

const kanbanPath = path.join(__dirname, 'src/components/KanbanBoard.tsx');
let kanbanContent = fs.readFileSync(kanbanPath, 'utf8');

// 1. Fix bgStyle: change backgroundImage to background so hex colors work.
kanbanContent = kanbanContent.replace(
  `  const bgStyle = boardBg ? {
    backgroundImage: isImageBg ? \`linear-gradient(rgba(255,255,255,0.45), rgba(255,255,255,0.45)), url(\${boardBg})\` : boardBg,
    backgroundSize: isImageBg ? 'cover' : undefined,
    backgroundPosition: isImageBg ? 'center' : undefined,
    backgroundRepeat: isImageBg ? 'no-repeat' : undefined,
    backgroundAttachment: isImageBg ? 'fixed' : undefined
  } : {};`,
  `  const bgStyle = boardBg ? {
    background: isImageBg ? \`linear-gradient(rgba(255,255,255,0.45), rgba(255,255,255,0.45)), url(\${boardBg})\` : boardBg,
    backgroundSize: isImageBg ? 'cover' : undefined,
    backgroundPosition: isImageBg ? 'center' : undefined,
    backgroundRepeat: isImageBg ? 'no-repeat' : undefined,
    backgroundAttachment: isImageBg ? 'fixed' : undefined
  } : {};`
);

// 2. Fix the Board Area wrapper.
// Previous: <div className="flex overflow-x-auto items-start gap-4 md:gap-6 lg:gap-8 px-4 md:px-6 lg:px-10 py-6 scroll-smooth custom-scrollbar w-screen relative -ml-[50vw] left-1/2 min-h-[calc(100vh-220px)]" style={bgStyle}>
// Replace with two wrappers:
// <div className="w-full min-h-[calc(100vh-220px)] overflow-x-auto overflow-y-hidden rounded-2xl" style={bgStyle}>
//   <div className="flex items-start gap-4 md:gap-6 lg:gap-8 px-4 md:px-6 lg:px-8 py-6 h-auto">

const oldWrapperStart = kanbanContent.indexOf('<div className="flex overflow-x-auto items-start gap-4 md:gap-6 lg:gap-8 px-4 md:px-6 lg:px-10 py-6 scroll-smooth custom-scrollbar w-screen relative -ml-[50vw] left-1/2 min-h-[calc(100vh-220px)]"\n        style={bgStyle}>');

if (oldWrapperStart !== -1) {
  const newWrapper = `<div 
        className="w-full min-h-[calc(100vh-220px)] overflow-x-auto overflow-y-hidden rounded-2xl scroll-smooth custom-scrollbar"
        style={bgStyle}
      >
        <div className="flex items-start gap-4 md:gap-6 lg:gap-8 px-4 md:px-6 lg:px-8 py-6 h-auto">`;
  
  kanbanContent = kanbanContent.replace(
    '<div className="flex overflow-x-auto items-start gap-4 md:gap-6 lg:gap-8 px-4 md:px-6 lg:px-10 py-6 scroll-smooth custom-scrollbar w-screen relative -ml-[50vw] left-1/2 min-h-[calc(100vh-220px)]"\n        style={bgStyle}>',
    newWrapper
  );

  // Need to close the extra div at the end of the map.
  // Find where the map ends.
  const mapEndStr = `          );
        })}
      </div>`;
  
  kanbanContent = kanbanContent.replace(
    mapEndStr,
    `          );
        })}
        </div>
      </div>`
  );
}

// 3. Fix Column height. Ensure no stretch.
kanbanContent = kanbanContent.replace(
  'w-[85vw] md:w-[340px] shrink-0 snap-center min-h-[180px] md:min-h-[220px] max-h-[75vh] md:max-h-[calc(100vh-280px)]',
  'w-[85vw] md:w-[340px] shrink-0 snap-center h-auto min-h-[220px] max-h-[75vh] md:max-h-[calc(100vh-280px)]'
);

// 4. Fix empty placeholder min-height so it doesn't stretch huge.
kanbanContent = kanbanContent.replace(
  'className="flex flex-col items-center justify-center border-2 border-dashed border-[#E2E8F0] dark:border-gray-700 bg-slate-50 dark:bg-gray-800/50 md:bg-white/40 rounded-2xl p-8 text-center text-[#64748B] dark:text-gray-300 min-h-[160px] h-full flex-1"',
  'className="flex flex-col items-center justify-center border-2 border-dashed border-[#E2E8F0] dark:border-gray-700 bg-slate-50 dark:bg-gray-800/50 md:bg-white/40 rounded-2xl p-8 text-center text-[#64748B] dark:text-gray-300 min-h-[120px] h-full flex-1"'
);

fs.writeFileSync(kanbanPath, kanbanContent, 'utf8');

console.log('Successfully fixed KanbanBoard.tsx');
