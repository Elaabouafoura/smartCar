import { CONCEPTS_PREFIX_PATH } from '@/constants/route.constant'
import {
    NAV_ITEM_TYPE_TITLE,
    NAV_ITEM_TYPE_COLLAPSE,
    NAV_ITEM_TYPE_ITEM,
} from '@/constants/navigation.constant'
import { ADMIN, USER } from '@/constants/roles.constant'
import type { NavigationTree } from '@/@types/navigation'

const conceptsNavigationConfig: NavigationTree[] = [
    {
        key: 'concepts',
        path: '',
        title: 'Concepts',
        translateKey: 'nav.concepts',
        icon: 'concepts',
        type: NAV_ITEM_TYPE_TITLE,
        authority: [ADMIN, USER],
        meta: {
            horizontalMenu: {
                layout: 'columns',
                columns: 4,
            },
        },
        subMenu: [
            {
                key: 'concepts.ai',
                path: '',
                title: 'AI',
                translateKey: 'nav.conceptsAi.ai',
                icon: 'ai',
                type: NAV_ITEM_TYPE_COLLAPSE,
                authority: [ADMIN, USER],
                meta: {
                    description: {
                        translateKey: 'nav.conceptsAi.aiDesc',
                        label: 'AI tools and resources',
                    },
                },
                subMenu: [
                    {
                        key: 'concepts.ai.chat',
                        path: `${CONCEPTS_PREFIX_PATH}/ai/chat`,
                        title: 'Chat',
                        translateKey: 'nav.conceptsAi.chat',
                        icon: 'aiChat',
                        type: NAV_ITEM_TYPE_ITEM,
                        authority: [ADMIN, USER],
                        meta: {
                            description: {
                                translateKey: 'nav.conceptsAi.chatDesc',
                                label: 'AI-powered chat systems',
                            },
                        },
                        subMenu: [],
                    },
                    {
                        key: 'concepts.ai.image',
                        path: `${CONCEPTS_PREFIX_PATH}/ai/image`,
                        title: 'Image',
                        translateKey: 'nav.conceptsAi.image',
                        icon: 'aiImage',
                        type: NAV_ITEM_TYPE_ITEM,
                        authority: [ADMIN, USER],
                        meta: {
                            description: {
                                translateKey: 'nav.conceptsAi.imageDesc',
                                label: 'AI image processing',
                            },
                        },
                        subMenu: [],
                    },
                ],
            },
           
           
            {
                key: 'concepts.products',
                path: '',
                title: 'vehicles',
                translateKey: 'nav.conceptsProducts.products',
                icon: 'products',
                type: NAV_ITEM_TYPE_COLLAPSE,
                authority: [ ADMIN,USER],
                meta: {
                    description: {
                        translateKey: 'nav.conceptsProducts.productsDesc',
                        label: 'Product inventory management',
                    },
                },
                subMenu: [
                    {
                        key: 'concepts.products.productList',
                        path: `${CONCEPTS_PREFIX_PATH}/vehicles/vehicle-list`,
                        title: 'Product List',
                        translateKey: 'nav.conceptsProducts.productList',
                        icon: 'productList',
                        type: NAV_ITEM_TYPE_ITEM,
                        authority:[ ADMIN,USER],
                        meta: {
                            description: {
                                translateKey:
                                    'nav.conceptsProducts.productListDesc',
                                label: 'All products listed',
                            },
                        },
                        subMenu: [],
                    },
                    
                    {
                        key: 'concepts.products.productCreate',
                        path: `${CONCEPTS_PREFIX_PATH}/vehicles/vehicle-create`,
                        title: 'Product Create',
                        translateKey: 'nav.conceptsProducts.productCreate',
                        icon: 'productCreate',
                        type: NAV_ITEM_TYPE_ITEM,
                        authority: [ ADMIN,USER],
                        meta: {
                            description: {
                                translateKey:
                                    'nav.conceptsProducts.productCreateDesc',
                                label: 'Add new product',
                            },
                        },
                        subMenu: [],
                    },
                ],
            },


            {
                key: 'concepts.uploads',
                path: '',
                title: 'Uploads',
                icon: 'fileManager',
                type: NAV_ITEM_TYPE_COLLAPSE,
                authority: [ADMIN],
                subMenu: [
                    {
                        key: 'concepts.uploads.uploadList',
                        path: `${CONCEPTS_PREFIX_PATH}/uploads/upload-list`,
                        title: 'Upload List',
                        icon: 'fileManager',
                        type: NAV_ITEM_TYPE_ITEM,
                        authority: [ADMIN,USER],
                        subMenu: [],
                        translateKey: ''
                    },
                ],
                translateKey: ''
            },
           
              
       
            {
                key: 'concepts.account',
                path: '',
                title: 'Account',
                translateKey: 'nav.conceptsAccount.account',
                icon: 'account',
                type: NAV_ITEM_TYPE_COLLAPSE,
                authority: [ADMIN, USER],
                meta: {
                    description: {
                        translateKey: 'nav.conceptsAccount.accountDesc',
                        label: 'Account settings and info',
                    },
                },
                subMenu: [
                    {
                        key: 'concepts.account.settings',
                        path: `${CONCEPTS_PREFIX_PATH}/account/settings`,
                        title: 'Settings',
                        translateKey: 'nav.conceptsAccount.settings',
                        icon: 'accountSettings',
                        type: NAV_ITEM_TYPE_ITEM,
                        authority: [ADMIN, USER],
                        meta: {
                            description: {
                                translateKey:
                                    'nav.conceptsAccount.settingsDesc',
                                label: 'Configure your settings',
                            },
                        },
                        subMenu: [],
                    },
                   
                ],
            },
           
          
          



            
            
           
           
        ],
    },
]

export default conceptsNavigationConfig
