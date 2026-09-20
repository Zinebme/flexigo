import type { Section } from "../sections/definitions";
import { shortId } from "../utils";
export const LITTLE_TEMPLATE_KEY="little-v1";
export function isLittleTemplate(key:string|null|undefined){return key?.trim().toLowerCase()===LITTLE_TEMPLATE_KEY}
function s(type:Section["type"],data:Record<string,unknown>):Section{return {id:shortId(),type,enabled:true,...data} as Section}
export function littleHomeSections(businessName:string):Section[]{return[
 s("hero",{badge:"عالم صغير مليء بالفرح",title:"كل ما يحتاجه طفلك… بحب",subtitle:"ملابس، ألعاب، عناية، نوم وهدايا — تجربة شراء عربية لطيفة وسهلة مع الدفع عند الاستلام.",desktop_image:"/images/little/hero.svg",mobile_image:"/images/little/hero-mobile.svg",button_text:"اكتشفي المجموعة",button_link:"/boutique",alignment:"right"}),
 s("collections",{title:"اختاري حسب المرحلة",subtitle:"حديثو الولادة، 0–2، 3–5، 6+، ألعاب وعناية",category_id:null,max_items:6}),
 s("products",{title:"الأكثر حباً",subtitle:"اختيارات جميلة وعملية للأمهات والأطفال",source:"featured",product_count:8}),
 s("features",{title:"لأن التفاصيل الصغيرة مهمة",subtitle:"تجربة بسيطة وموثوقة للعائلة",items:[{title:"اختيارات واضحة",text:"المقاس، اللون والعمر المناسب قبل الطلب."},{title:"دفع عند الاستلام",text:"تطلبي براحتك وتدفعي عند الاستلام."},{title:"توصيل 58 ولاية",text:"للمنزل أو المكتب حسب الولاية."},{title:"طلب آمن",text:"السعر والمخزون يتحقق منهما الخادم."}]}),
 s("banner",{title:"هدايا تخلّي اللحظة أجمل",subtitle:"اختيارات لطيفة للميلاد، السبوع وأعياد الميلاد.",desktop_image:"/images/little/banner.svg",mobile_image:"/images/little/banner-mobile.svg",button_text:"شاهدي الهدايا",button_link:"/boutique",alignment:"right",show_desktop:true,show_mobile:true}),
 s("products",{title:"وصل حديثاً",subtitle:"أشياء صغيرة تستحق الاكتشاف",source:"latest",product_count:8}),
 s("reviews",{title:`أمهات يحببن ${businessName}`,subtitle:"تجارب حقيقية من زبائن المتجر"}),
 s("faq",{title:"أسئلة الأمهات",subtitle:"كل ما تحتاجين معرفته قبل الطلب",max_items:8}),
 s("contact",{title:"نحن هنا لمساعدتك",text:"راسلينا على واتساب لأي سؤال عن المقاس أو المنتج.",show_phone:true,show_whatsapp:true,show_email:false}),
]}
export function littleContentPages(businessName:string){return[
 {key:"about",title:"من نحن",content:{sections:[s("hero",{title:businessName,subtitle:"متجر أطفال عربي لطيف، عملي وسهل الاستخدام.",image:"/images/little/banner.svg",button_text:"تسوّقي الآن",button_link:"/boutique",alignment:"right"})]}},
 {key:"faq",title:"الأسئلة الشائعة",content:{sections:[s("faq",{title:"الأسئلة الشائعة",subtitle:null,max_items:12})]}},
 {key:"contact",title:"تواصلي معنا",content:{sections:[s("contact",{title:"تواصلي معنا",text:"يسعدنا مساعدتك.",show_phone:true,show_whatsapp:true,show_email:true})]}},
]}
