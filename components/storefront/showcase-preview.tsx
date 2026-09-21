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
    key: "volt", brand: "VOLT STORE", mark: "V", eyebrow: "SMART TECH / NEW DROP",
    title: "تقنية أذكى.\nيوم أسهل.",
    subtitle: "أجهزة وإكسسوارات مختارة بعناية، مواصفات واضحة وتجربة شراء سريعة من الهاتف حتى باب المنزل.",
    hero: "/images/volt/hero-premium.webp", productHref: "/preview/volt/produit",
    categories: [{name:"ساعات ذكية",icon:"⌚",caption:"للصحة والعمل"},{name:"صوتيات",icon:"◉",caption:"صوت أوضح"},{name:"طاقة وشحن",icon:"↯",caption:"طاقة طوال اليوم"},{name:"إكسسوارات",icon:"＋",caption:"كل ما يكمل جهازك"}],
    products: [{name:"ساعة AMOLED X2",price:"8 900 DA",oldPrice:"10 900 DA",image:"/images/volt/watch-premium.webp",badge:"الأكثر طلباً"},{name:"سماعات ANC Pro",price:"5 400 DA",image:"/images/volt/earbuds.svg",badge:"جديد"},{name:"بطارية 20000mAh",price:"4 900 DA",image:"/images/volt/power.svg"},{name:"مكبر صوت Mini",price:"3 900 DA",image:"/images/volt/speaker.svg"}],
    storyTitle:"تقنية عملية ترافق يومك", storyText:"من ساعة AMOLED لمتابعة نشاطك إلى سماعات بعزل الضوضاء وبطارية تكفي يومك: أجهزة مختارة بأداء موثوق ومواصفات واضحة.",
    benefits:[{icon:"⚡",title:"مواصفات واضحة",text:"السعة والتوافق والخصائص موضحة قبل الطلب."},{icon:"✓",title:"منتجات مختارة",text:"أجهزة عملية للعمل، الرياضة والاستعمال اليومي."},{icon:"▣",title:"الدفع عند الاستلام",text:"ادفع ثمن طلبك عند وصوله إليك."},{icon:"⌁",title:"توصيل 58 ولاية",text:"إلى المنزل أو مكتب شركة التوصيل."}],
    reviews:[{name:"رياض، الجزائر",text:"الساعة خفيفة والشاشة واضحة حتى تحت الشمس، والبطارية ممتازة."},{name:"سارة، وهران",text:"السماعات مريحة في المكالمات وعزل الصوت أفضل مما توقعت."},{name:"أمين، سطيف",text:"البطارية وصلت مغلفة جيداً وسعتها مناسبة للسفر والعمل."}],
    faqs:[{q:"هل الأجهزة متوافقة مع Android وiPhone؟",a:"التوافق مذكور مع كل منتج. ساعة X2 والسماعات تعملان مع Android وiOS عبر Bluetooth."},{q:"هل يوجد ضمان؟",a:"نستبدل المنتج إذا وصل بعيب مصنعي بعد التواصل معنا خلال 48 ساعة من الاستلام."},{q:"متى يصل طلبي؟",a:"عادة خلال 2 إلى 5 أيام عمل حسب الولاية ونوع التوصيل."}],
  },
  dar: {
    key:"dar",brand:"DAR HOME",mark:"د",eyebrow:"HOME / LIVING / COD",title:"بيت أهدأ.\nتفاصيل أجمل.",subtitle:"اختيارات دافئة وعملية للمطبخ، الترتيب والديكور؛ مصممة لتجعل البيت أجمل والحياة اليومية أسهل.",hero:"/images/dar/hero-premium.webp",productHref:"/preview/dar/produit",
    categories:[{name:"المطبخ",icon:"◒",caption:"أساسيات يومية"},{name:"التنظيم",icon:"▦",caption:"مساحة مرتبة"},{name:"الديكور",icon:"✦",caption:"لمسات دافئة"},{name:"المفروشات",icon:"⌂",caption:"راحة البيت"}],
    products:[{name:"منظم منزلي طبيعي",price:"2 900 DA",oldPrice:"3 400 DA",image:"/images/dar/storage-premium.webp",badge:"مختار لكم"},{name:"طقم مطبخ عملي",price:"4 500 DA",image:"/images/dar/kitchen.svg"},{name:"مزهرية خزفية",price:"3 200 DA",image:"/images/dar/decor.svg"},{name:"طقم مفارش قطنية",price:"5 900 DA",image:"/images/dar/linen.svg"}],
    storyTitle:"رتّب أقل، واستمتع ببيتك أكثر",storyText:"منظمات متعددة الاستعمال، أدوات مطبخ ومفروشات بألوان طبيعية تجمع بين الشكل الهادئ والاستعمال اليومي حتى يبقى كل شيء في مكانه.",
    benefits:[{icon:"⌂",title:"عملي يومياً",text:"قطع تسهّل الترتيب والاستعمال اليومي."},{icon:"◌",title:"مقاسات موضحة",text:"الأبعاد والخامات تساعدك على اختيار المناسب."},{icon:"▣",title:"الدفع عند الاستلام",text:"اطلب براحتك وادفع عند وصول طلبك."},{icon:"♧",title:"تغليف آمن",text:"حماية إضافية للقطع الحساسة أثناء النقل."}],
    reviews:[{name:"نادية، البليدة",text:"المنظم وفر لي مساحة كبيرة في المطبخ والخامة سهلة التنظيف."},{name:"ريم، الجزائر",text:"ألوان المفارش هادئة مثل الصور والمقاس كان مضبوطاً."},{name:"سمية، قسنطينة",text:"المزهرية وصلت مغلفة بعناية وتعطي لمسة جميلة للصالون."}],
    faqs:[{q:"كيف أختار المقاس المناسب؟",a:"ستجد الأبعاد الدقيقة مع كل منتج. قِس المساحة وقارنها بالمقاسات الموضحة."},{q:"كيف أنظف المنتجات؟",a:"تعليمات العناية تختلف حسب الخامة وتظهر في وصف كل قطعة."},{q:"ماذا لو وصلت قطعة مكسورة؟",a:"تواصل معنا فوراً مع صورة للقطعة والتغليف وسنتكفل بالاستبدال."}],
  },
  pulse: {
    key:"pulse",brand:"PULSE SPORT",mark:"P",eyebrow:"MOVE / TRAIN / REPEAT",title:"تحرّك أكثر.\nاستعد أقوى.",subtitle:"معدات للجري والجيم والتمرين المنزلي، في تجربة رياضية سريعة وواضحة تشجعك تبدأ الآن.",hero:"/images/pulse/hero-premium.webp",productHref:"/preview/pulse/produit",
    categories:[{name:"الجري",icon:"↗",caption:"سرعة وخفة"},{name:"الجيم",icon:"◆",caption:"قوة وتحمل"},{name:"كرة القدم",icon:"●",caption:"تحكم وأداء"},{name:"المنزل",icon:"∞",caption:"تمرين أينما كنت"}],
    products:[{name:"حذاء جري PULSE",price:"6 900 DA",oldPrice:"7 900 DA",image:"/images/pulse/shoes-premium.webp",badge:"TOP GEAR"},{name:"قارورة Active",price:"1 900 DA",image:"/images/pulse/bottle.svg"},{name:"أشرطة مقاومة",price:"2 400 DA",image:"/images/pulse/bands.svg",badge:"HOME FIT"},{name:"كرة تدريب Pro",price:"3 300 DA",image:"/images/pulse/ball.svg"}],
    storyTitle:"حذاء واحد، كيلومترات أكثر",storyText:"حذاء PULSE بوسادة خفيفة ونعل مرن يمنحك ثباتاً مريحاً في الجري والمشي. اختر مقاسك وأكمل تجهيزك بقارورة وأشرطة مقاومة.",
    benefits:[{icon:"↗",title:"دليل مقاسات",text:"قياسات واضحة لاختيار الحذاء المناسب."},{icon:"⚡",title:"معدات عملية",text:"للجيم، الخارج والتمرين في البيت."},{icon:"▣",title:"الدفع عند الاستلام",text:"اطلب الآن وادفع عند استلام الشحنة."},{icon:"✓",title:"استبدال المقاس",text:"يمكن طلب الاستبدال وفق الشروط الموضحة."}],
    reviews:[{name:"ياسين، باتنة",text:"الحذاء مريح في الجري والنعل يعطي ثباتاً جيداً على الطريق."},{name:"مريم، بجاية",text:"أشرطة المقاومة قوية وتناسب تمارين البيت بدون معدات كثيرة."},{name:"خالد، وهران",text:"اتبعت دليل المقاسات وجاء الحذاء مناسباً من أول مرة."}],
    faqs:[{q:"كيف أختار مقاس الحذاء؟",a:"قِس طول القدم بالسنتيمتر وطابقه مع دليل المقاسات."},{q:"هل أشرطة المقاومة مناسبة للمبتدئين؟",a:"نعم، الطقم يحتوي مستويات مختلفة لتبدأ بالأخف وتتقدم تدريجياً."},{q:"هل يمكن استبدال المقاس؟",a:"نعم، إذا بقي الحذاء دون استعمال وفي تغليفه الأصلي."}],
  },
  little: {
    key:"little",brand:"LITTLE",mark:"☀",eyebrow:"BABY / KIDS / LOVE",title:"عالم صغير.\nفرحة كبيرة.",subtitle:"ملابس، ألعاب، عناية وهدايا في متجر لطيف وآمن، بحركات مرحة وتجربة بسيطة لكل أم.",hero:"/images/little/hero-premium.webp",productHref:"/preview/little/produit",
    categories:[{name:"حديثو الولادة",icon:"☁",caption:"نعومة من أول يوم"},{name:"ملابس",icon:"♡",caption:"راحة وحركة"},{name:"ألعاب",icon:"★",caption:"تعلم ومرح"},{name:"هدايا",icon:"▣",caption:"لحظات لا تُنسى"}],
    products:[{name:"طقم رضيع هدية",price:"3 900 DA",oldPrice:"4 500 DA",image:"/images/little/baby-premium.webp",badge:"محبوب الأمهات"},{name:"لعبة تعليمية خشبية",price:"2 900 DA",image:"/images/little/toy.svg"},{name:"طقم أطفال قطني",price:"4 200 DA",image:"/images/little/clothes.svg"},{name:"صندوق هدية صغير",price:"2 500 DA",image:"/images/little/gift.svg",badge:"جاهز للإهداء"}],
    storyTitle:"هدية دافئة لأول لقاء",storyText:"طقم رضيع ناعم من قطع أساسية متناسقة، مرتب داخل علبة أنيقة وجاهز للإهداء. اختاري اللون والعمر المناسب وأضيفي بطاقة تهنئة للمولود.",
    benefits:[{icon:"♡",title:"خامات ناعمة",text:"قطع مريحة ولطيفة على بشرة الطفل."},{icon:"★",title:"حسب العمر",text:"المقاس والعمر المناسب موضحان مع كل منتج."},{icon:"▣",title:"تغليف هدايا",text:"باقات مرتبة بعناية وجاهزة لتقديمها."},{icon:"☁",title:"الدفع عند الاستلام",text:"اطلبي بسهولة وادفعي عند وصول الطلب."}],
    reviews:[{name:"أم ياسمين، الجزائر",text:"الموقع مفرح وواضح، لقيت العمر والمقاس بسرعة."},{name:"ليلى، تيزي وزو",text:"الصور جميلة وتعطي ثقة في جودة الهدية."},{name:"سلمى، عنابة",text:"حبيت الحركات الخفيفة والألوان، بدون ما يكون مزعج."}],
    faqs:[{q:"كيف أختار العمر المناسب؟",a:"راجعي العمر والطول المقترحين مع كل منتج، وإذا ترددتِ اختاري المقاس الأكبر."},{q:"هل يمكن إرسال الطلب كهدية؟",a:"نعم، اختاري صندوق الهدية وأضيفي نص بطاقة التهنئة عند تأكيد الطلب."},{q:"هل الألعاب آمنة للأطفال؟",a:"العمر المناسب وتعليمات الاستخدام مذكورة مع كل لعبة، ويجب استعمالها تحت إشراف بالغ."}],
  },
};

function PreviewHeader({config}:{config:ShowcaseConfig}) {
  const root=`/preview/${config.key}`;
  return <>
    <div className="showcase-demo">توصيل إلى 58 ولاية • الدفع عند الاستلام</div>
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
    <div className="showcase-product-copy"><p>{product.name}</p><div><strong className="showcase-price" dir="ltr">{product.price}</strong>{product.oldPrice?<del className="showcase-price" dir="ltr">{product.oldPrice}</del>:null}</div></div>
  </Link>)}</div>;
}

export function ShowcaseHome({theme}:{theme:ShowcaseTheme}) {
  const config=showcaseConfigs[theme]; const root=`/preview/${theme}`;
  return <div dir="rtl" className={`showcase showcase-${theme}`}>
    <PreviewHeader config={config}/>
    <main>
      <section className="showcase-hero"><div className="showcase-wrap showcase-hero-grid">
        <div className="showcase-hero-copy showcase-reveal"><span className="showcase-eyebrow">{config.eyebrow}</span><h1>{config.title.split("\n").map((line,i)=><span key={line}>{line}{i===0?<br/>:null}</span>)}</h1><p>{config.subtitle}</p><div className="showcase-actions"><Link href={`${root}/boutique`} className="showcase-button">اكتشف المجموعة</Link><Link href={config.productHref} className="showcase-button showcase-button-ghost">شاهد الأكثر طلباً</Link></div><div className="showcase-trust"><span>✓ دفع عند الاستلام</span><span>✓ 58 ولاية</span><span>✓ خدمة زبائن</span></div></div>
        <div className="showcase-hero-media showcase-reveal"><StorefrontImage src={config.hero} alt={config.brand} fill priority sizes="(max-width:1024px) 100vw,55vw" className="object-cover"/><span className="showcase-orbit showcase-orbit-one"/><span className="showcase-orbit showcase-orbit-two"/><div className="showcase-float-card"><b>4.9/5</b><span>تقييم الزبائن</span></div></div>
      </div></section>
      <section className="showcase-section"><div className="showcase-wrap"><div className="showcase-heading"><span>اكتشف</span><h2>تسوّق حسب ما تحتاج</h2><p>دخول سريع إلى أهم أقسام المتجر</p></div><div className="showcase-categories">{config.categories.map((category,index)=><Link href={`${root}/boutique`} key={category.name} className="showcase-category showcase-reveal" style={{animationDelay:`${index*70}ms`}}><i>{category.icon}</i><b>{category.name}</b><small>{category.caption}</small><em>←</em></Link>)}</div></div></section>
      <section className="showcase-section showcase-products-section" id="products"><div className="showcase-wrap"><div className="showcase-heading showcase-heading-row"><div><span>مختاراتنا</span><h2>الأكثر طلباً</h2><p>منتجات واضحة بصور وأسعار وخيارات حقيقية</p></div><Link href={`${root}/boutique`}>عرض كل المنتجات ←</Link></div><ProductGrid config={config}/></div></section>
      <section className="showcase-story"><div className="showcase-wrap showcase-story-grid"><div className="showcase-story-media"><StorefrontImage src={config.hero} alt={config.storyTitle} fill sizes="(max-width:1024px) 100vw,55vw" className="object-cover"/></div><div className="showcase-story-copy"><span className="showcase-eyebrow">اختيار الموسم</span><h2>{config.storyTitle}</h2><p>{config.storyText}</p><Link href={config.productHref} className="showcase-button">اكتشف المنتج</Link></div></div></section>
      <section className="showcase-section"><div className="showcase-wrap"><div className="showcase-heading"><span>لماذا نحن؟</span><h2>تسوّق براحة وثقة</h2></div><div className="showcase-benefits">{config.benefits.map((item,index)=><article key={item.title} className="showcase-benefit showcase-reveal" style={{animationDelay:`${index*80}ms`}}><i>{item.icon}</i><h3>{item.title}</h3><p>{item.text}</p></article>)}</div></div></section>
      <section className="showcase-section showcase-reviews-section"><div className="showcase-wrap"><div className="showcase-heading"><span>آراء حقيقية</span><h2>تجربة يتحدث عنها الزبائن</h2></div><div className="showcase-reviews">{config.reviews.map(review=><figure key={review.name}><div>★★★★★</div><blockquote>“{review.text}”</blockquote><figcaption>{review.name}</figcaption></figure>)}</div></div></section>
      <section className="showcase-section"><div className="showcase-wrap showcase-faq-grid"><div className="showcase-heading"><span>قبل الطلب</span><h2>أسئلة شائعة</h2><p>إجابات مباشرة تساعد الزبون يكمل طلبه بدون تردد.</p></div><div className="showcase-faq">{config.faqs.map(item=><details key={item.q}><summary>{item.q}<span>＋</span></summary><p>{item.a}</p></details>)}</div></div></section>
      <section className="showcase-cta"><div className="showcase-wrap"><span>{config.eyebrow}</span><h2>وجدت ما يناسبك؟</h2><p>اكتشف المجموعة الكاملة واطلب منتجك المفضل اليوم.</p><div><Link href={`${root}/boutique`} className="showcase-button">تسوّق الآن</Link><Link href={config.productHref} className="showcase-button showcase-button-ghost">الأكثر طلباً</Link></div></div></section>
    </main>
    <ShowcaseFooter config={config}/>
  </div>;
}

function ShowcaseFooter({config}:{config:ShowcaseConfig}) { const root=`/preview/${config.key}`; return <footer className="showcase-footer"><div className="showcase-wrap"><div><div className="showcase-brand"><span>{config.mark}</span>{config.brand}</div><p>منتجات مختارة بعناية مع توصيل إلى كامل الجزائر.</p></div><div><b>تصفح</b><Link href={`${root}/boutique`}>كل المنتجات</Link><Link href={config.productHref}>الأكثر طلباً</Link><Link href={`${root}/a-propos`}>قصتنا</Link></div><div><b>مساعدة</b><Link href={`${root}/faq`}>الأسئلة الشائعة</Link><Link href={`${root}/contact`}>تواصل معنا</Link><span>التوصيل إلى 58 ولاية</span></div></div></footer>; }

export function ShowcaseInnerPage({theme,page}:{theme:ShowcaseTheme;page:"boutique"|"a-propos"|"faq"|"contact"}) {
  const config=showcaseConfigs[theme];
  return <div dir="rtl" className={`showcase showcase-${theme}`}><PreviewHeader config={config}/><main>
    {page==="boutique"?<><section className="showcase-page-hero"><div className="showcase-wrap"><span className="showcase-eyebrow">SHOP THE COLLECTION</span><h1>كل المنتجات</h1><p>تصفّح التشكيلة واختر اللون، المقاس أو المواصفات التي تناسبك.</p></div></section><section className="showcase-section"><div className="showcase-wrap"><div className="showcase-filter"><span>الكل</span>{config.categories.map(x=><button key={x.name} type="button">{x.name}</button>)}</div><ProductGrid config={config}/></div></section></>:null}
    {page==="a-propos"?<><section className="showcase-page-hero"><div className="showcase-wrap"><span className="showcase-eyebrow">OUR STORY</span><h1>اختيارات أجمل للحياة اليومية</h1><p>{config.storyText}</p></div></section><section className="showcase-section"><div className="showcase-wrap showcase-about-grid"><div className="showcase-about-media"><StorefrontImage src={config.hero} alt={config.brand} fill sizes="(max-width:1024px) 100vw,50vw" className="object-cover"/></div><div><span className="showcase-eyebrow">{config.eyebrow}</span><h2>{config.storyTitle}</h2><p>نختار منتجات عملية بجودة جيدة وتفاصيل واضحة، ونرافق طلبك من الاختيار حتى الاستلام.</p><div className="showcase-benefits showcase-benefits-two">{config.benefits.slice(0,2).map(x=><article className="showcase-benefit" key={x.title}><i>{x.icon}</i><h3>{x.title}</h3><p>{x.text}</p></article>)}</div></div></div></section></>:null}
    {page==="faq"?<section className="showcase-section showcase-page-content"><div className="showcase-wrap showcase-faq-grid"><div className="showcase-heading"><span>مساعدة</span><h1>الأسئلة الشائعة</h1><p>معلومات واضحة عن المنتجات، الطلب والتوصيل.</p></div><div className="showcase-faq">{[...config.faqs,{q:"هل يمكن تعديل الطلب بعد إرساله؟",a:"نعم، تواصل معنا في أقرب وقت قبل تسليم الشحنة لشركة التوصيل."},{q:"كيف أتتبع طلبي؟",a:"بعد تأكيد الطلب يمكنك التواصل مع خدمة الزبائن لمعرفة حالة الشحنة."}].map(item=><details key={item.q}><summary>{item.q}<span>＋</span></summary><p>{item.a}</p></details>)}</div></div></section>:null}
    {page==="contact"?<section className="showcase-section showcase-page-content"><div className="showcase-wrap showcase-contact-grid"><div><span className="showcase-eyebrow">CONTACT</span><h1>نحن هنا لمساعدتك</h1><p>لديك سؤال عن منتج، المقاس أو التوصيل؟ تواصل معنا وسنساعدك على الاختيار.</p><div className="showcase-contact-cards"><a href="#contact-form">واتساب <b>رد سريع</b></a><a href="#contact-form">الهاتف <b>خدمة الزبائن</b></a><a href="#contact-form">البريد <b>للاستفسارات</b></a></div></div><form id="contact-form" className="showcase-contact-form"><label>الاسم<input placeholder="اكتب اسمك"/></label><label>رقم الهاتف<input dir="ltr" placeholder="05 XX XX XX XX"/></label><label>الرسالة<textarea rows={5} placeholder="كيف نقدر نساعدك؟"/></label><button type="button" className="showcase-button">إرسال الرسالة</button><small>نرد عادة خلال ساعات العمل.</small></form></div></section>:null}
  </main><ShowcaseFooter config={config}/></div>;
}
