interface Group {
  fullname: string /*there store full name for example KB-111,
    PZ-23, МЕОА-11f(23/24н.р.) and so on*/;
  numberForSort: number /* there will store number
    of group we need for sorting. In group where number is 23 we will
    add 0 like 203 for correct sorting */;
}
//return sorted array of Group
const sortGroup = (groups: Group[]): Group[] => {
  return groups.sort((a, b) => a.numberForSort - b.numberForSort);
};
//return "PZ" if PZ-24, or LMP if LMP-5124
const findPrefixOfGroup = (group: string): string => {
  const firstDashIndex = group.indexOf("-");
  return group.slice(0, firstDashIndex);
};
//return 203 if PZ-23, or 111 if IO-111faf
const extractNumberFromGroup = (input: string): number | null => {
  const match = input.match(/-(\d+)/); // Regular expression to find a dash followed by digits
  let str = match[1];
  //add 0 to xx number
  if (str.length === 2) {
    str = `${str.slice(0, 1)}0${str.slice(1)}`;
  }
  return match ? Number(str) : null; // Return the digits if a match is found, otherwise null
};
export const sortingGroupsArray = (groups: string[]): string[] => {
  const map = new Map<string, Group[]>();
  for (const group of groups) {
    const prefixGroup: string = findPrefixOfGroup(group);
    const numberGroup: number | null = extractNumberFromGroup(group);
    if (!numberGroup) {
      console.log("there is error in extracting group number in ", group);
      return [];
    }
    const instance: Group = { fullname: group, numberForSort: numberGroup };
    if (!map.has(prefixGroup)) {
      //if there is not such group prefix
      map.set(prefixGroup, [instance]);
    } else {
      const oldValue: Group[] = map.get(prefixGroup);
      map.set(prefixGroup, [...oldValue, instance]);
    }
  }
  //sort each group in prefix map separately
  for (const key of map.keys()) {
    const groups: string[] = sortGroup(map.get(key));
    map.set(key, groups);
  }
  const resultGroups: string[] = [];
  for (const key of map.keys()) {
    for (const group of map.get(key)) {
      resultGroups.push(group.fullname);
    }
  }

  return resultGroups;
};
