import Link from "next/link";
import { StorefrontImage } from "./image";
import "./showcase-preview.css";

export type ShowcaseTheme = "volt" | "dar" | "pulse" | "little";

type Product = { name: string; price: string; oldPrice?: string; image: string; badge?: string };
type ShowcaseConfig = {
  key: ShowcaseTheme;
  brand: string;
  mark: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  hero: string;
  productHref: string;
  categories: Array<{ name: string; icon: string; caption: string }>;
  products: Product[];
  storyTitle: string;
  storyText: string;
  benefits: Array<{ icon: string; title: string; text: string }>;
  reviews: Array<{ name: string; text: string }>;
  faqs: Array<{ q: string; a: string }>;
};

export const showcaseConfigs: Record<ShowcaseTheme, ShowcaseConfig> = {
  volt: {
    key: "volt", brand: "VOLT STORE", mark: "V", eyebrow: "SMART TECH / COD",
    title: "تقنية أذكى.\nيوم أسهل.",
    subtitle: "أجهزة وإكسسوارات مختارة بعناية، مواصفات واضحة وتجربة شراء سريعة من الهاتف حتى باب المنزل.",
    hero: "/images/volt/hero-premium.webp", productHref: "/preview/volt/produit",
    categories: [{name:"ساعات ذكية",icon:"⌚",caption:"للصحة والعمل"},{name:"صوتيات",icon:"◉",caption:"صوت أوضح"},{name:"طاقة وشحن",icon:"↯",caption:"طاقة طوال اليوم"},{name:"إكسسوارات",icon:"＋",caption:"كل ما يكمل جهازك"}],
    products: [{name:"ساعة AMOLED X2",price:"8 900 دج",oldPrice:"10 900 دج",image:"/images/volt/watch-premium.webp",badge:"الأكثر طلباً"},{name:"سماعات ANC Pro",price:"5 400 دج",image:"/images/volt/earbuds.svg",badge:"جديد"},{name:"بطارية 20000mAh",price:"4 900 دج",image:"/images/volt/power.svg"},{name:"مكبر صوت Mini",price:"3 900 دج",image:"/images/volt/speaker.svg"}],
    storyTitle:"أداء حقيقي بدون تعقيد", storyText:"واجهة تقنية نظيفة تشرح الفائدة والمواصفات بسرعة، مع خيارات المنتج والعروض ونموذج الطلب في نفس المسار.",
    benefits:[{icon:"⚡",title:"اختيار سريع",text:"مواصفات وخيارات واضحة قبل الطلب."},{icon:"✓",title:"طلب موثوق",text:"السعر والمخزون يتحقق منهما الخادم."},{icon:"▣",title:"الدفع عند الاستلام",text:"تجربة COD مناسبة للسوق الجزائري."},{icon:"⌁",title:"توصيل 58 ولاية",text:"للمنزل أو المكتب حسب الإعدادات."}],
    reviews:[{name:"رياض، الجزائر",text:"الواجهة واضحة، لقيت السعة واللون والسعر بدون ما نضيع."},{name:"سارة، وهران",text:"طلبت من الهاتف في أقل من دقيقة، والتفاصيل كانت كاملة."},{name:"أمين، سطيف",text:"ستايل احترافي ويعطي ثقة في المنتجات التقنية."}],
    faqs:[{q:"هل يمكن اختيار اللون والسعة؟",a:"نعم، صفحة المنتج تعرض الخيارات المتوفرة والسعر المرتبط بكل اختيار."},{q:"كيف يتم الدفع؟",a:"الدفع عند الاستلام، مع عرض سعر المنتج والتوصيل قبل تأكيد الطلب."},{q:"هل التوصيل متاح لكل الولايات؟",a:"يمكن لصاحب المتجر تفعيل مناطق وأسعار التوصيل حسب الولاية."}],
  },
  dar: {
    key:"dar",brand:"DAR HOME",mark:"د",eyebrow:"HOME / LIVING / COD",title:"بيت أهدأ.\nتفاصيل أجمل.",subtitle:"اختيارات دافئة وعملية للمطبخ، الترتيب والديكور؛ مصممة لتجعل البيت أجمل والحياة اليومية أسهل.",hero:"/images/dar/hero-premium.webp",productHref:"/preview/dar/produit",
    categories:[{name:"المطبخ",icon:"◒",caption:"أساسيات يومية"},{name:"التنظيم",icon:"▦",caption:"مساحة مرتبة"},{name:"الديكور",icon:"✦",caption:"لمسات دافئة"},{name:"المفروشات",icon:"⌂",caption:"راحة البيت"}],
    products:[{name:"منظم منزلي طبيعي",price:"2 900 دج",oldPrice:"3 400 دج",image:"/images/dar/storage-premium.webp",badge:"مختار لكم"},{name:"طقم مطبخ عملي",price:"4 500 دج",image:"/images/dar/kitchen.svg"},{name:"ديكور خزفي",price:"3 200 دج",image:"/images/dar/decor.svg"},{name:"طقم مفارش مريح",price:"5 900 دج",image:"/images/dar/linen.svg"}],
    storyTitle:"مساحات تحكي ذوقك",storyText:"صور lifestyle كبيرة، مجموعات حسب مساحة البيت ونصوص هادئة تبيع المنتج داخل سياقه، لا كقطعة معزولة.",
    benefits:[{icon:"⌂",title:"عملي يومياً",text:"منتجات تنظم وتخدم البيت فعلاً."},{icon:"◌",title:"ألوان ومقاسات",text:"خيارات واضحة لكل مساحة واحتياج."},{icon:"▣",title:"الدفع عند الاستلام",text:"اطلب براحتك وادفع عند الوصول."},{icon:"♧",title:"توصيل مرن",text:"للمنزل أو المكتب حسب الولاية."}],
    reviews:[{name:"نادية، البليدة",text:"الصور خلتني نفهم الحجم والاستعمال قبل ما نطلب."},{name:"ريم، الجزائر",text:"الموقع دافئ ومنظم، والطلب من الهاتف سهل جداً."},{name:"سمية، قسنطينة",text:"حبيت تقسيم المنتجات حسب الغرفة والاستعمال."}],
    faqs:[{q:"هل الألوان المعروضة متوفرة؟",a:"تظهر الخيارات النشطة فقط، ويمكن تحديث المخزون من لوحة المتجر."},{q:"هل توجد مقاسات مختلفة؟",a:"نعم، يمكن ربط كل مقاس أو لون بسعر ومخزون مستقل."},{q:"كيف أعرف سعر التوصيل؟",a:"يظهر سعر المنزل أو المكتب بعد اختيار الولاية في نموذج الطلب."}],
  },
  pulse: {
    key:"pulse",brand:"PULSE SPORT",mark:"P",eyebrow:"MOVE / TRAIN / REPEAT",title:"تحرّك أكثر.\nاستعد أقوى.",subtitle:"معدات للجري والجيم والتمرين المنزلي، في تجربة رياضية سريعة وواضحة تشجعك تبدأ الآن.",hero:"/images/pulse/hero-premium.webp",productHref:"/preview/pulse/produit",
    categories:[{name:"الجري",icon:"↗",caption:"سرعة وخفة"},{name:"الجيم",icon:"◆",caption:"قوة وتحمل"},{name:"كرة القدم",icon:"●",caption:"تحكم وأداء"},{name:"المنزل",icon:"∞",caption:"تمرين أينما كنت"}],
    products:[{name:"حذاء جري PULSE",price:"6 900 دج",oldPrice:"7 900 دج",image:"/images/pulse/shoes-premium.webp",badge:"TOP GEAR"},{name:"قارورة Active",price:"1 900 دج",image:"/images/pulse/bottle.svg"},{name:"أشرطة مقاومة",price:"2 400 دج",image:"/images/pulse/bands.svg",badge:"HOME FIT"},{name:"كرة تدريب Pro",price:"3 300 دج",image:"/images/pulse/ball.svg"}],
    storyTitle:"جهّز روتينك القادم",storyText:"تصميم سريع بإيقاع رياضي، فئات حسب النشاط، بطاقات قوية وصفحة منتج تعرض المقاس واللون والعروض بدون تشتيت.",
    benefits:[{icon:"↗",title:"أداء أوضح",text:"تفاصيل المنتج والمقاس في مكان واحد."},{icon:"⚡",title:"طلب سريع",text:"مسار قصير ومهيأ للموبايل."},{icon:"▣",title:"الدفع عند الاستلام",text:"مناسب للتجارة الإلكترونية المحلية."},{icon:"✓",title:"مخزون حقيقي",text:"كل اختيار مرتبط بمخزونه وسعره."}],
    reviews:[{name:"ياسين، باتنة",text:"ستايل رياضي قوي والمنتجات باينة من أول نظرة."},{name:"مريم، بجاية",text:"اخترت المقاس واللون بسهولة، خاصة على الهاتف."},{name:"خالد، وهران",text:"صفحة المنتج منظمة وتخليك تكمل الطلب مباشرة."}],
    faqs:[{q:"كيف أختار المقاس؟",a:"صفحة المنتج تعرض المقاسات المتوفرة فقط ويمكن إضافة دليل مقاسات في الوصف."},{q:"هل توجد عروض كمية؟",a:"نعم، يمكن تفعيل عروض لقطعتين أو أكثر بسعر إجمالي خاص."},{q:"هل أستطيع الطلب من الهاتف؟",a:"كل الواجهة ونموذج الطلب مصممان للموبايل أولاً."}],
  },
  little: {
    key:"little",brand:"LITTLE",mark:"☀",eyebrow:"BABY / KIDS / LOVE",title:"عالم صغير.\nفرحة كبيرة.",subtitle:"ملابس، ألعاب، عناية وهدايا في متجر لطيف وآمن، بحركات مرحة وتجربة بسيطة لكل أم.",hero:"/images/little/hero-premium.webp",productHref:"/preview/little/produit",
    categories:[{name:"حديثو الولادة",icon:"☁",caption:"نعومة من أول يوم"},{name:"ملابس",icon:"♡",caption:"راحة وحركة"},{name:"ألعاب",icon:"★",caption:"تعلم ومرح"},{name:"هدايا",icon:"▣",caption:"لحظات لا تُنسى"}],
    products:[{name:"طقم رضيع هدية",price:"3 900 دج",oldPrice:"4 500 دج",image:"/images/little/baby-premium.webp",badge:"محبوب الأمهات"},{name:"لعبة تعليمية",price:"2 900 دج",image:"/images/little/toy.svg"},{name:"طقم أطفال مريح",price:"4 200 دج",image:"/images/little/clothes.svg"},{name:"صندوق هدية",price:"2 500 دج",image:"/images/little/gift.svg",badge:"جاهز للإهداء"}],
    storyTitle:"تفاصيل صغيرة تصنع الذكرى",storyText:"ألوان مبهجة، صور حقيقية ولمسات كرتونية متحركة بلطف، مع تنظيم حسب العمر ونموذج طلب واضح للأمهات.",
    benefits:[{icon:"♡",title:"اختيارات مطمئنة",text:"العمر، المقاس واللون واضحون قبل الطلب."},{icon:"★",title:"تجربة مرحة",text:"حركات لطيفة بدون إزعاج أو تشتيت."},{icon:"▣",title:"الدفع عند الاستلام",text:"طلب سهل وآمن للعائلة."},{icon:"☁",title:"موبايل أولاً",text:"أزرار كبيرة ونصوص مريحة للقراءة."}],
    reviews:[{name:"أم ياسمين، الجزائر",text:"الموقع مفرح وواضح، لقيت العمر والمقاس بسرعة."},{name:"ليلى، تيزي وزو",text:"الصور جميلة وتعطي ثقة في جودة الهدية."},{name:"سلمى، عنابة",text:"حبيت الحركات الخفيفة والألوان، بدون ما يكون مزعج."}],
    faqs:[{q:"كيف أختار العمر المناسب؟",a:"كل منتج يعرض الأعمار والمقاسات المتوفرة ويمكن إضافة دليل واضح في الوصف."},{q:"هل المنتجات مناسبة كهدية؟",a:"يمكن إنشاء فئة للهدايا وإضافة باقات أو عروض كمية خاصة."},{q:"هل الطلب حقيقي في المعاينة؟",a:"لا، هذه معاينة تفاعلية فقط ولا تنشئ أي طلب حقيقي."}],
  },
};

function PreviewHeader({config}:{config:ShowcaseConfig}) {
  const root=`/preview/${config.key}`;
  return <>
    <div className="showcase-demo">معاينة تفاعلية — لا يتم إنشاء طلبات حقيقية</div>
    <header className="showcase-header"><div className="showcase-wrap showcase-nav">
      <Link href={root} className="showcase-brand"><span>{config.mark}</span>{config.brand}</Link>
      <nav><Link href={root}>الرئيسية</Link><Link href={`${root}/boutique`}>المتجر</Link><Link href={`${root}/a-propos`}>من نحن</Link><Link href={`${root}/faq`}>الأسئلة</Link><Link href={`${root}/contact`}>تواصل</Link></nav>
      <Link href={`${root}/boutique`} className="showcase-button showcase-button-small">تسوّق الآن</Link>
    </div></header>
  </>;
}

function ProductGrid({config,limit=4}:{config:ShowcaseConfig;limit?:number}) {
  return <div className="showcase-products">{config.products.slice(0,limit).map((product,index)=><Link key={product.name} href={config.productHref} className="showcase-product showcase-reveal" style={{animationDelay:`${index*80}ms`}}>
    <div className="showcase-product-image"><StorefrontImage src={product.image} alt={product.name} fill sizes="(max-width:640px) 50vw, 25vw" className="object-cover"/>{product.badge?<span className="showcase-product-badge">{product.badge}</span>:null}</div>
    <div className="showcase-product-copy"><p>{product.name}</p><div><strong>{product.price}</strong>{product.oldPrice?<del>{product.oldPrice}</del>:null}</div></div>
  </Link>)}</div>;
}

export function ShowcaseHome({theme}:{theme:ShowcaseTheme}) {
  const config=showcaseConfigs[theme]; const root=`/preview/${theme}`;
  return <div dir="rtl" className={`showcase showcase-${theme}`}>
    <PreviewHeader config={config}/>
    <main>
      <section className="showcase-hero"><div className="showcase-wrap showcase-hero-grid">
        <div className="showcase-hero-copy showcase-reveal"><span className="showcase-eyebrow">{config.eyebrow}</span><h1>{config.title.split("\n").map((line,i)=><span key={line}>{line}{i===0?<br/>:null}</span>)}</h1><p>{config.subtitle}</p><div className="showcase-actions"><Link href={`${root}/boutique`} className="showcase-button">اكتشف المجموعة</Link><Link href={config.productHref} className="showcase-button showcase-button-ghost">جرّب صفحة المنتج</Link></div><div className="showcase-trust"><span>✓ دفع عند الاستلام</span><span>✓ 58 ولاية</span><span>✓ طلب آمن</span></div></div>
        <div className="showcase-hero-media showcase-reveal"><StorefrontImage src={config.hero} alt={config.brand} fill priority sizes="(max-width:1024px) 100vw,55vw" className="object-cover"/><span className="showcase-orbit showcase-orbit-one"/><span className="showcase-orbit showcase-orbit-two"/><div className="showcase-float-card"><b>4.9/5</b><span>تقييم الزبائن</span></div></div>
      </div></section>
      <section className="showcase-section"><div className="showcase-wrap"><div className="showcase-heading"><span>اكتشف</span><h2>تسوّق حسب ما تحتاج</h2><p>دخول سريع إلى أهم أقسام المتجر</p></div><div className="showcase-categories">{config.categories.map((category,index)=><Link href={`${root}/boutique`} key={category.name} className="showcase-category showcase-reveal" style={{animationDelay:`${index*70}ms`}}><i>{category.icon}</i><b>{category.name}</b><small>{category.caption}</small><em>←</em></Link>)}</div></div></section>
      <section className="showcase-section showcase-products-section" id="products"><div className="showcase-wrap"><div className="showcase-heading showcase-heading-row"><div><span>مختاراتنا</span><h2>الأكثر طلباً</h2><p>منتجات واضحة بصور وأسعار وخيارات حقيقية</p></div><Link href={`${root}/boutique`}>عرض كل المنتجات ←</Link></div><ProductGrid config={config}/></div></section>
      <section className="showcase-story"><div className="showcase-wrap showcase-story-grid"><div className="showcase-story-media"><StorefrontImage src={config.hero} alt={config.storyTitle} fill sizes="(max-width:1024px) 100vw,55vw" className="object-cover"/></div><div className="showcase-story-copy"><span className="showcase-eyebrow">THE EXPERIENCE</span><h2>{config.storyTitle}</h2><p>{config.storyText}</p><Link href={config.productHref} className="showcase-button">شاهد التجربة كاملة</Link></div></div></section>
      <section className="showcase-section"><div className="showcase-wrap"><div className="showcase-heading"><span>لماذا نحن؟</span><h2>كل ما يحتاجه الزبون ليطلب بثقة</h2></div><div className="showcase-benefits">{config.benefits.map((item,index)=><article key={item.title} className="showcase-benefit showcase-reveal" style={{animationDelay:`${index*80}ms`}}><i>{item.icon}</i><h3>{item.title}</h3><p>{item.text}</p></article>)}</div></div></section>
      <section className="showcase-section showcase-reviews-section"><div className="showcase-wrap"><div className="showcase-heading"><span>آراء حقيقية</span><h2>تجربة يتحدث عنها الزبائن</h2></div><div className="showcase-reviews">{config.reviews.map(review=><figure key={review.name}><div>★★★★★</div><blockquote>“{review.text}”</blockquote><figcaption>{review.name}</figcaption></figure>)}</div></div></section>
      <section className="showcase-section"><div className="showcase-wrap showcase-faq-grid"><div className="showcase-heading"><span>قبل الطلب</span><h2>أسئلة شائعة</h2><p>إجابات مباشرة تساعد الزبون يكمل طلبه بدون تردد.</p></div><div className="showcase-faq">{config.faqs.map(item=><details key={item.q}><summary>{item.q}<span>＋</span></summary><p>{item.a}</p></details>)}</div></div></section>
      <section className="showcase-cta"><div className="showcase-wrap"><span>{config.eyebrow}</span><h2>جاهز تشوف المتجر كما يراه زبونك؟</h2><p>استكشف المنتجات، صفحة التفاصيل ونموذج الطلب التفاعلي.</p><div><Link href={`${root}/boutique`} className="showcase-button">دخول المتجر</Link><Link href={config.productHref} className="showcase-button showcase-button-ghost">صفحة المنتج</Link></div></div></section>
    </main>
    <ShowcaseFooter config={config}/>
  </div>;
}

function ShowcaseFooter({config}:{config:ShowcaseConfig}) { const root=`/preview/${config.key}`; return <footer className="showcase-footer"><div className="showcase-wrap"><div><div className="showcase-brand"><span>{config.mark}</span>{config.brand}</div><p>متجر كامل، سريع ومصمم للبيع بالدفع عند الاستلام.</p></div><div><b>تصفح</b><Link href={`${root}/boutique`}>المتجر</Link><Link href={config.productHref}>صفحة المنتج</Link><Link href={`${root}/a-propos`}>من نحن</Link></div><div><b>مساعدة</b><Link href={`${root}/faq`}>الأسئلة الشائعة</Link><Link href={`${root}/contact`}>تواصل معنا</Link><span>التوصيل إلى 58 ولاية</span></div></div></footer>; }

export function ShowcaseInnerPage({theme,page}:{theme:ShowcaseTheme;page:"boutique"|"a-propos"|"faq"|"contact"}) {
  const config=showcaseConfigs[theme];
  return <div dir="rtl" className={`showcase showcase-${theme}`}><PreviewHeader config={config}/><main>
    {page==="boutique"?<><section className="showcase-page-hero"><div className="showcase-wrap"><span className="showcase-eyebrow">SHOP THE EDIT</span><h1>كل المنتجات</h1><p>تصفّح التشكيلة، قارن الخيارات وافتح صفحة المنتج التفاعلية.</p></div></section><section className="showcase-section"><div className="showcase-wrap"><div className="showcase-filter"><span>الكل</span>{config.categories.map(x=><button key={x.name} type="button">{x.name}</button>)}</div><ProductGrid config={config}/><div className="showcase-shop-note">هذه معاينة. في المتجر الحقيقي تظهر منتجات التاجر وصوره ومخزونه من Supabase.</div></div></section></>:null}
    {page==="a-propos"?<><section className="showcase-page-hero"><div className="showcase-wrap"><span className="showcase-eyebrow">OUR STORY</span><h1>متجر له شخصية، لا مجرد كتالوج</h1><p>{config.storyText}</p></div></section><section className="showcase-section"><div className="showcase-wrap showcase-about-grid"><div className="showcase-about-media"><StorefrontImage src={config.hero} alt={config.brand} fill sizes="(max-width:1024px) 100vw,50vw" className="object-cover"/></div><div><span className="showcase-eyebrow">{config.eyebrow}</span><h2>{config.storyTitle}</h2><p>صمم هذا القالب ليعرض المنتجات داخل عالم بصري متكامل، مع صفحات متجر ومنتج وأسئلة وتواصل، وتجربة عربية RTL كاملة.</p><div className="showcase-benefits showcase-benefits-two">{config.benefits.slice(0,2).map(x=><article className="showcase-benefit" key={x.title}><i>{x.icon}</i><h3>{x.title}</h3><p>{x.text}</p></article>)}</div></div></div></section></>:null}
    {page==="faq"?<section className="showcase-section showcase-page-content"><div className="showcase-wrap showcase-faq-grid"><div className="showcase-heading"><span>مساعدة</span><h1>الأسئلة الشائعة</h1><p>معلومات مختصرة وواضحة قبل تأكيد الطلب.</p></div><div className="showcase-faq">{[...config.faqs,{q:"هل يمكن تعديل الطلب بعد إرساله؟",a:"يمكن للمتجر التواصل مع الزبون للتأكيد وتحديث الطلب من لوحة التحكم."},{q:"هل بياناتي محمية؟",a:"الطلب يرسل عبر المسار الآمن للتطبيق وتطبق صلاحيات Supabase الحالية."}].map(item=><details key={item.q}><summary>{item.q}<span>＋</span></summary><p>{item.a}</p></details>)}</div></div></section>:null}
    {page==="contact"?<section className="showcase-section showcase-page-content"><div className="showcase-wrap showcase-contact-grid"><div><span className="showcase-eyebrow">CONTACT</span><h1>نحن هنا لمساعدتك</h1><p>في المتجر الحقيقي تظهر معلومات الاتصال التي يضيفها التاجر: الهاتف، واتساب والبريد الإلكتروني.</p><div className="showcase-contact-cards"><a href="#contact-form">واتساب <b>رد سريع</b></a><a href="#contact-form">الهاتف <b>خدمة الزبائن</b></a><a href="#contact-form">البريد <b>للاستفسارات</b></a></div></div><form id="contact-form" className="showcase-contact-form"><label>الاسم<input placeholder="اكتب اسمك"/></label><label>رقم الهاتف<input dir="ltr" placeholder="05 XX XX XX XX"/></label><label>الرسالة<textarea rows={5} placeholder="كيف نقدر نساعدك؟"/></label><button type="button" className="showcase-button">إرسال الرسالة التجريبية</button><small>المعاينة لا ترسل أي بيانات.</small></form></div></section>:null}
  </main><ShowcaseFooter config={config}/></div>;
}
