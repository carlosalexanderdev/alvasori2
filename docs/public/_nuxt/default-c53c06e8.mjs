import{_ as w,r as e,o as g,c as h,w as r,a as o,d as D,n as s,e as y,f as b,t as k,b as V}from"./entry-d377055c.mjs";const $={name:"DefaultLayout",data:()=>({showDrawer:!1,temporaryDrawer:!0}),mounted(){setTimeout(()=>{this.temporaryDrawer=!1},200)}},C=V("strong",null,"AlvaSori",-1);function x(a,t,B,N,S,T){const l=e("v-app-bar-nav-icon"),p=e("v-img"),d=e("v-app-bar-title"),_=e("v-app-bar"),c=e("v-navigation-drawer"),i=e("v-container"),m=e("v-main"),u=e("v-col"),v=e("v-footer"),f=e("v-app");return g(),h(f,{theme:"light"},{default:r(()=>[o(_,{app:"",dark:"",density:"prominent",elevation:"0","clipped-left":"",color:"primary",class:s(["rounded-be-xl",{"rounded-bs-xl":!a.showDrawer}])},{prepend:r(()=>[o(l,{onClick:t[0]||(t[0]=D(n=>a.showDrawer=!a.showDrawer,["stop"]))})]),default:r(()=>[o(d,null,{default:r(()=>[o(p,{src:"/logo/name-no-background-white.png","max-height":"80",class:"my-3"})]),_:1})]),_:1},8,["class"]),o(c,{modelValue:a.showDrawer,"onUpdate:modelValue":t[1]||(t[1]=n=>a.showDrawer=n),app:"",clipped:"",dark:"",temporary:a.temporaryDrawer,color:"primary",floating:""},null,8,["modelValue","temporary"]),o(m,null,{default:r(()=>[o(i,null,{default:r(()=>[y(a.$slots,"default")]),_:3})]),_:3}),o(v,{app:"",dark:"",absolute:"",color:"primary",class:s(["rounded-te-xl",{"rounded-ts-xl":!a.showDrawer}])},{default:r(()=>[o(u,{class:"text-center",cols:"12"},{default:r(()=>[b(k(new Date().getFullYear())+" \u2014 ",1),C]),_:1})]),_:1},8,["class"])]),_:3})}var A=w($,[["render",x]]);export{A as default};
