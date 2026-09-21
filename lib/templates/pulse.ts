import type { Section } from "../sections/definitions";
import { shortId } from "../utils";
export const PULSE_TEMPLATE_KEY="pulse-v1";
export function isPulseTemplate(key:string|null|undefined){return key?.trim().toLowerCase()===PULSE_TEMPLATE_KEY}
function s(type:Section["type"],data:Record<string,unknown>):Section{return {id:shortId(),type,enabled:true,...data} as Section}
export function pulseHomeSections(businessName:string):Section[]{return[
 s("hero",{badge:"تحرّك أكثر. استعد أقوى.",title:"معدات رياضية لحركة بلا حدود",subtitle:"رياضة، لياقة، ركض وتمارين منزلية — اختيارات عملية مع الدفع عند الاستلام.",desktop_image:"/images/pulse/hero-premium.webp",mobile_image:"/images/pulse/hero-premium.webp",button_text:"ابدأ التسوق",button_link:"/boutique",alignment:"right"}),
 s("collections",{title:"تسوّق حسب نشاطك",subtitle:"الجري، الجيم، كرة القدم، المنزل وأكثر",category_id:null,max_items:6}),
 s("products",{title:"الأكثر طلباً",subtitle:"معدات يختارها الرياضيون يومياً",source:"featured",product_count:8}),
 s("features",{title:"جاهز للانطلاق؟",subtitle:"كل ما تحتاجه لتطلب بثقة",items:[{title:"الدفع عند الاستلام",text:"اطلب بسهولة وادفع عند الاستلام."},{title:"58 ولاية",text:"توصيل للمنزل أو المكتب حسب الولاية."},{title:"خيارات واضحة",text:"المقاسات والألوان والباقات قبل الطلب."},{title:"شراء آمن",text:"السعر والمخزون يحسبان على الخادم."}]}),
 s("banner",{title:"ابنِ روتينك. ارفع مستواك.",subtitle:"منتجات تساعدك على التدريب بانتظام من البيت أو الجيم.",desktop_image:"/images/pulse/hero-premium.webp",mobile_image:"/images/pulse/hero-premium.webp",button_text:"اكتشف المجموعة",button_link:"/boutique",alignment:"right",show_desktop:true,show_mobile:true}),
 s("products",{title:"وصل حديثاً",subtitle:"أحدث الإضافات للتمرين والحركة",source:"latest",product_count:8}),
 s("reviews",{title:`آراء مجتمع ${businessName}`,subtitle:"تجارب حقيقية من زبائن المتجر"}),
 s("faq",{title:"أسئلة شائعة",subtitle:"كل ما تحتاج معرفته قبل الطلب",max_items:8}),
 s("contact",{title:"تحتاج مساعدة؟",text:"تواصل معنا وسنساعدك تختار المنتج المناسب.",show_phone:true,show_whatsapp:true,show_email:false}),
]}
export function pulseContentPages(businessName:string){return[
 {key:"about",title:"من نحن",content:{sections:[s("hero",{title:businessName,subtitle:"متجر رياضي عربي عملي وسريع.",image:"/images/pulse/hero-premium.webp",button_text:"تسوّق الآن",button_link:"/boutique",alignment:"right"})]}},
 {key:"faq",title:"الأسئلة الشائعة",content:{sections:[s("faq",{title:"الأسئلة الشائعة",subtitle:null,max_items:12})]}},
 {key:"contact",title:"تواصل معنا",content:{sections:[s("contact",{title:"تواصل معنا",text:"نحن هنا للإجابة عن أسئلتك.",show_phone:true,show_whatsapp:true,show_email:true})]}},
]}
