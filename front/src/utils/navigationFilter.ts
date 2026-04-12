
import type { NavigationTree } from '@/@types/navigation'

export function filterNavByAuthority(
    navTree: NavigationTree[],
    userAuthority: string[]
): NavigationTree[] {
    return navTree
        .filter((item) =>
            item.authority.some((role) => userAuthority.includes(role))
        )
        .map((item) => ({
            ...item,
            subMenu: filterNavByAuthority(item.subMenu ?? [], userAuthority),
        }))
}