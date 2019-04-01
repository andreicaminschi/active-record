import _Vue from "vue";
import Api from "@/asdf/api/Api";
import {IApiDriver} from "@/asdf/api/IApiDriver";

declare module 'vue/types/vue' {
    interface Vue {
        $api: IApiDriver;
    }

    interface VueConstructor {
        $api: IApiDriver;
    }

}

export default function AsdfPlugin(Vue: typeof _Vue, options?: any): void {
    Vue.$api = Vue.prototype.$api = new Api('https://ccx-api.scriptics.ro', '1.0');
}