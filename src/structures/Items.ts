import fetch from 'node-fetch';

import { cleanString } from '../util';
import { OSRS_BOX_BASE_URL } from '../constants';
import { ItemID, Item, PartialItem } from '../meta/types';
import Collection from './Collection';

import _items from '../data/items/item_data.json';
const items = _items as Record<string, string>;

export const itemNameMap: Map<string, number> = new Map();

type ItemResolvable = number | string;
export interface ItemCollection {
	[index: string]: Item;
}

const USELESS_ITEMS = [617];

class Items extends Collection<number, Item | PartialItem> {
	public async fetchAll(): Promise<void> {
		const allItems: ItemCollection = await fetch(
			`${OSRS_BOX_BASE_URL}/items-complete.json`
		).then((res): Promise<any> => res.json());

		for (const item of Object.values(allItems).filter(
			(item): boolean => !item.placeholder && !item.noted && !item.duplicate
		)) {
			this.set(item.id, item);
		}
	}

	public async fetch(input: ItemResolvable): Promise<Item> {
		const id = this.resolveID(input);

		const item: Item = await fetch(`${OSRS_BOX_BASE_URL}/items-json/${id}.json`).then(
			(res): Promise<any> => res.json()
		);

		this.set(item.id, item);
		return item;
	}

	public get(item: ItemResolvable): Item | PartialItem | undefined {
		const id = this.resolveID(item);
		if (!id) return undefined;
		return super.get(id);
	}

	private resolveID(input: ItemResolvable): ItemID | undefined {
		if (typeof input === 'number') {
			return input;
		}

		if (typeof input === 'string') {
			const cleanName = cleanString(input);
			return itemNameMap.get(cleanName);
		}

		return undefined;
	}
}

const itemsExport = new Items();

for (const [id, name] of Object.entries(items)) {
	const numID = parseInt(id);
	const cleanName = cleanString(name);

	if (itemNameMap.has(cleanName)) continue;
	if (USELESS_ITEMS.includes(numID)) continue;
	itemsExport.set(numID, { name, id: numID });
	itemNameMap.set(cleanName, numID);
}

export default itemsExport;
