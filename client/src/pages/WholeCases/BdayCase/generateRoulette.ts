import Bear from "../../../../assets/prize/bear.webp";
import StarIcon from "../../../../assets/prize/StarsIcon.webp";
import happyBirth from "../../../../assets/prize/happyBirth.webp";
export interface Item {
  id: string;
  img: string;
  price: number;
  collection?: string;
  model?: string;
  backdrop?: string;
  symbol?: string;
}

export const items: Record<number | string, Item> = {
  1: { id: "5170233102089322756", img: Bear, price: 15},
  12: { id: "5782984811920491178", img: happyBirth, price: 350},
};

let currentMarginLeft = 0;

export function generateRoulette(winningId?: string) {
  const rouletteContainer = document.getElementById("roulette-container") as HTMLElement;
  if (!rouletteContainer) return;

  // Reset
  currentMarginLeft = 0;
  rouletteContainer.innerHTML = "";
  rouletteContainer.style.marginLeft = "0px";
  rouletteContainer.style.transition = "none";

  const totalItems = 104;
  const winningIndex = 95;

  // Create an array of all available items
  const availableItems = Object.values(items);
  
  // Create an array to store the distribution of items
  const distribution: Item[] = [];
  
  // Fill the distribution array with random items
  for (let i = 0; i < totalItems; i++) {
    if (winningId && i === winningIndex) {
      // Place the winning item at the winning position
      const winningItem = availableItems.find(item => item.id === winningId);
      if (winningItem) {
        distribution.push(winningItem);
      } else {
        // If winning item not found, use a random item
        distribution.push(availableItems[Math.floor(Math.random() * availableItems.length)]);
      }
    } else {
      // For other positions, randomly select an item
      distribution.push(availableItems[Math.floor(Math.random() * availableItems.length)]);
    }
  }

  // Create roulette items based on the distribution
  for (const item of distribution) {
    rouletteContainer.appendChild(createRouletteItemById(item.id));
  }
}

export function startRolling(winningId: string, onComplete: () => void) {
  const rouletteContainer = document.getElementById("roulette-container");
  const holder = document.querySelector(".raffle-roller-holder") as HTMLElement;

  if (!rouletteContainer || !holder) return;

  const itemWidth = 85; // обязательно совпадает с .item width
  const moveSteps = 95.5;

  // 👇 Получаем ширину самого holder и вычитаем половину ширины айтема
  const offsetToCenter = holder.offsetWidth / 2 - itemWidth / 2;

  const currentMarginLeft = -(moveSteps * itemWidth) + offsetToCenter;

  rouletteContainer.style.transition = "all 4s cubic-bezier(.08,.6,0,1)";
  rouletteContainer.style.marginLeft = `${currentMarginLeft}px`;

  setTimeout(() => {
    highlightWinningItem(winningId);
    onComplete();
  }, 4000); // чуть больше, чем transition
}

function highlightWinningItem(winningId: string) {
  const rouletteContainer = document.getElementById("roulette-container");
  if (!rouletteContainer) return;

  const itemsList = Array.from(rouletteContainer.children) as HTMLElement[];

  for (const item of itemsList) {
    if (item.dataset.id === winningId) {
      item.classList.add("winning-item");
      break;
    }
  }
}

// Новая функция для создания элемента по ID
function createRouletteItemById(itemId: string): HTMLElement {
  const element = document.createElement("div");
  element.classList.add("item");

  let selectedItem = Object.values(items).find(item => item.id === itemId);
  if (!selectedItem) {
    console.error(`Item with id ${itemId} not found`);
    // Возвращаем первый доступный предмет как запасной вариант
    selectedItem = Object.values(items)[0];
  }

  element.dataset.id = selectedItem.id;
  element.style.backgroundImage = `url(${selectedItem.img})`;

  const priceContainer = document.createElement("div");
  priceContainer.classList.add("price-container");

  const starImg = document.createElement("img");
  starImg.src = StarIcon;
  starImg.classList.add("star-icon");

  const priceText = document.createElement("span");
  priceText.innerText = `${selectedItem.price}`;
  priceText.classList.add("price-text");

  priceContainer.appendChild(starImg);
  priceContainer.appendChild(priceText);
  element.appendChild(priceContainer);

  return element;
}
