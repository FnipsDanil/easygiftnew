// import Bear from "../../../../assets/prize/bear.webp";
// import Heart from "../../../../assets/prize/heartTape.webp";
// import Gift from "../../../../assets/prize/gift.webp";
// import StarIcon from "../../../../assets/prize/StarsIcon.webp";
// import Gem from "../../../../assets/prize/gem.webp";
// import Ring from "../../../../assets/prize/ring.webp";
// import Trophy from "../../../../assets/prize/trophy.webp";
// import Rocket from "../../../../assets/prize/rocket.webp";
// import Roses from "../../../../assets/prize/roses.webp";
// import Cake from "../../../../assets/prize/cake.webp";
// import RoseSingle from "../../../../assets/prize/roseSingle.webp";
// import Champangne from "../../../../assets/prize/champangne.webp";
// import easterCake from "../../../../assets/prize/easterCake.webp";
// import easterRabbit from "../../../../assets/prize/easterRabbit.webp";
// import easterEgg from "../../../../assets/prize/easterEgg.webp";
// // import rareRocket from "../../../../assets/prize/rareRocket.webp";
// export interface Item {
//   id: string;
//   img: string;
//   price: number;
//   collection?: string;
//   model?: string;
//   backdrop?: string;
//   symbol?: string;
// }

// export const items: Record<number | string, Item> = {
//   1: { id: "5170233102089322756", img: Bear, price: 15},
//   2: { id: "5170145012310081615", img: Heart, price: 15},
//   3: { id: "5170250947678437525", img: Gift, price: 25},
//   7: { id: "5170564780938756245", img: Rocket, price: 50},
//   8: { id: "5170314324215857265", img: Roses, price: 50},
//   9: { id: "5170144170496491616", img: Cake, price: 50},
//   10: { id: "5168103777563050263", img: RoseSingle, price: 25},
//   11: { id: "6028601630662853006", img: Champangne, price: 50},
//   // 14: { id: "5773791997064119815", img: easterCake, price: 75},
//   15: { id: "5773725897517433693", img: easterRabbit, price: 150},
//   // 16: { id: "5773668482394620318", img: easterEgg, price: 200},
// };

// let currentMarginLeft = 0;

// export function generateRoulette(winningId?: string) {
//   const rouletteContainer = document.getElementById("roulette-container") as HTMLElement;
//   if (!rouletteContainer) return;

//   // Reset
//   currentMarginLeft = 0;
//   rouletteContainer.innerHTML = "";
//   rouletteContainer.style.marginLeft = "0px";
//   rouletteContainer.style.transition = "none";

//   const totalItems = 104;
//   const winningIndex = 95;

//   // Создаем массив всех доступных ID, кроме выигрышного
//   const availableIds = Object.values(items)
//     .map(item => item.id)
//     .filter(id => id !== winningId);

//   for (let i = 0; i < totalItems; i++) {
//     if (winningId && i === winningIndex) {
//       // Проверяем существование выигрышного предмета
//       const winningItem = Object.values(items).find(item => item.id === winningId);
//       if (!winningItem) {
//         console.error(`Item with id ${winningId} not found`);
//         // Если предмет не найден, используем первый доступный
//         rouletteContainer.appendChild(createRouletteItemById(availableIds[0]));
//       } else {
//         rouletteContainer.appendChild(createRouletteItemById(winningId));
//       }
//     } else {
//       // Для остальных позиций используем циклический перебор доступных ID
//       const index = i % availableIds.length;
//       rouletteContainer.appendChild(createRouletteItemById(availableIds[index]));
//     }
//   }
// }

// export function startRolling(winningId: string, onComplete: () => void) {
//   const rouletteContainer = document.getElementById("roulette-container");
//   const holder = document.querySelector(".raffle-roller-holder") as HTMLElement;

//   if (!rouletteContainer || !holder) return;

//   const itemWidth = 85; // обязательно совпадает с .item width
//   const moveSteps = 95.5;

//   // 👇 Получаем ширину самого holder и вычитаем половину ширины айтема
//   const offsetToCenter = holder.offsetWidth / 2 - itemWidth / 2;

//   const currentMarginLeft = -(moveSteps * itemWidth) + offsetToCenter;

//   rouletteContainer.style.transition = "all 4s cubic-bezier(.08,.6,0,1)";
//   rouletteContainer.style.marginLeft = `${currentMarginLeft}px`;

//   setTimeout(() => {
//     highlightWinningItem(winningId);
//     onComplete();
//   }, 4000); // чуть больше, чем transition
// }

// function highlightWinningItem(winningId: string) {
//   const rouletteContainer = document.getElementById("roulette-container");
//   if (!rouletteContainer) return;

//   const itemsList = Array.from(rouletteContainer.children) as HTMLElement[];

//   for (const item of itemsList) {
//     if (item.dataset.id === winningId) {
//       item.classList.add("winning-item");
//       break;
//     }
//   }
// }

// // Новая функция для создания элемента по ID
// function createRouletteItemById(itemId: string): HTMLElement {
//   const element = document.createElement("div");
//   element.classList.add("item");

//   let selectedItem = Object.values(items).find(item => item.id === itemId);
//   if (!selectedItem) {
//     console.error(`Item with id ${itemId} not found`);
//     // Возвращаем первый доступный предмет как запасной вариант
//     selectedItem = Object.values(items)[0];
//   }

//   element.dataset.id = selectedItem.id;
//   element.style.backgroundImage = `url(${selectedItem.img})`;

//   const priceContainer = document.createElement("div");
//   priceContainer.classList.add("price-container");

//   const starImg = document.createElement("img");
//   starImg.src = StarIcon;
//   starImg.classList.add("star-icon");

//   const priceText = document.createElement("span");
//   priceText.innerText = `${selectedItem.price}`;
//   priceText.classList.add("price-text");

//   priceContainer.appendChild(starImg);
//   priceContainer.appendChild(priceText);
//   element.appendChild(priceContainer);

//   return element;
// }
