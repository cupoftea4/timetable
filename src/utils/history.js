import {createBrowserHistory} from "history";

const HISTORY = createBrowserHistory();

export function setSearchParameters(paramsObject) {
	const url = new URL(window.location.href);
	url.search = "";
	for(let key in paramsObject) {
		url.searchParams.set(key, paramsObject[key])
	}
	replaceHistoryState(url.href)
}

export function addSearchParameters(paramsObject, overwrite=true) {
	const url = new URL(window.location.href);
	for(let key in paramsObject) {
		let value = url.searchParams.get(key);
		if(value && !overwrite) {
			continue;
		} else {
			url.searchParams.set(key, paramsObject[key])
		}
	}
	replaceHistoryState(url.href)
}

export function replaceHistoryState(newUrl) {
	const url = new URL(newUrl);
	const path = url.pathname + url.search+url.hash;
	HISTORY.replace(path, {})
}

export function getCurrentParameters() {
	const url = new URL(window.location.href);
	let result = {}
	for(let entry of url.searchParams.entries()) {
	    const [key, value] = entry;
	    result[key] = value;
	}
	return result;
}

export function openInNewTab(url) {
	window.open(url, "_black");
}

export function getHash(location = window.location) {
	return decodeURI(location.hash || location.pathname).replace(/^#?\//, '').replace('#', ''); // #/Settings -> Settings
}
