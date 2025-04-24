// import React, { useEffect } from "react";
// import Dice from "../../../../assets/prize/dice.webp";
// import StarIcon from "../../../../assets/prize/StarsIcon.webp";

// type PrizeItem = {
//   id: string;
//   img: string;
//   price: number;
//   chance: string;
// };

// interface PossiblePrizesProps {
//   items: Record<number, PrizeItem>;
// }

// export const PossiblePrizes: React.FC<PossiblePrizesProps> = ({ items }) => {
//   useEffect(() => {
//     const container = document.querySelector(".possible-prizes-container") as HTMLElement | null;
//     if (!container) return;

//     const handleWheelScroll = (event: WheelEvent) => {
//       event.preventDefault();
//       container.scrollLeft += event.deltaY; // Горизонтальный скролл
//     };

//     container.addEventListener("wheel", handleWheelScroll as EventListener);
//     return () => container.removeEventListener("wheel", handleWheelScroll as EventListener);
//   }, []);

//   // Sort items to ensure Easter items appear first
//   const sortedItems = Object.values(items).sort((a, b) => {
//     // Easter items IDs
//     const easterIds = ["5773791997064119815", "5773725897517433693", "5773668482394620318"];
    
//     // If both items are Easter items, maintain their original order
//     if (easterIds.includes(a.id) && easterIds.includes(b.id)) {
//       return easterIds.indexOf(a.id) - easterIds.indexOf(b.id);
//     }
    
//     // If only one item is an Easter item, it should come first
//     if (easterIds.includes(a.id)) return -1;
//     if (easterIds.includes(b.id)) return 1;
    
//     return 0;
//   });

//   return (
//     <div className="possible-prizes-container">
//       <div className="possible-prizes-inner">
//         {sortedItems.map((prize, index) => (
//           <div key={index} className="possible-prize">
//             <div className="prize-chance">
//               {prize.chance} <img src={Dice} alt="dice" className="dice-icon" />
//             </div>
//             <div className="prize-image">
//               <img src={prize.img} alt={`Item ID: ${prize.id}`} />
//             </div>
//             <div className="prize-stars">
//               <img src={StarIcon} alt="star" /> {prize.price}
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };
