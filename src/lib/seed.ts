import { prisma } from "./prisma";

export async function seedDatabaseIfEmpty() {
  try {
    // 1. فحص وجود التوجيهات التدريبية لـ علوش ستور وتغذيتها إن لم توجد
    const trainingExists = await prisma.aiTraining.findUnique({
      where: { key: "store_rules" }
    });

    if (!trainingExists) {
      console.log("🌱 Seeding default AI Training guidelines for Alosh Store...");
      await prisma.aiTraining.create({
        data: {
          key: "store_rules",
          title: "دليل وتدريب الذكاء الاصطناعي - علوش ستور",
          content: `أنت تحلل وتصيغ الردود بالنيابة عن "علوش ستور" (Alosh Store)، وهو متجر متكامل رائد متخصص في بيع الاشتراكات الرقمية والخدمات الترفيهية والتعليمية.
العملة الرسمية المعتمدة للمبيعات هي الشيكل (₪ أو شيكل).

قائمة الاشتراكات الرقمية المتوفرة وأسعارها الرسمية:
1. اشتراك نتفليكس (Netflix) شهري (شاشة خاصة بجودة 4K UHD): بسعر 35 شيكل.
2. اشتراك يوتيوب بريميوم (YouTube Premium) سنة كاملة (على إيميل العميل الشخصي بدون إعلانات): بسعر 80 شيكل.
3. اشتراك سبوتيفاي بريميوم (Spotify) سنة كاملة: بسعر 60 شيكل.
4. اشتراك شاهد VIP الباقة الرياضية (Shahid VIP Sports) شهري: بسعر 25 شيكل، أو سنوي بسعر 180 شيكل.
5. اشتراك ChatGPT Plus (رسمي وخاص بالعميل) شهري: بسعر 90 شيكل.
6. اشتراك IPTV الذكي (سيرفر متكامل يضم أكثر من 8000 قناة رياضية وترفيهية ومكتبة أفلام) سنة كاملة: بسعر 120 شيكل.
7. اشتراك أدوبي كرييتف كلاود (Adobe Creative Cloud) سنة كاملة على إيميل العميل: بسعر 250 شيكل.

توجيهات وقواعد الرد الذكي والتحليل (Sales & Objection Handling):
- بخصوص السعر المرتفع: وضح للعميل أن جميع اشتراكاتنا رسمية ومضمونة طوال فترة الاشتراك بنسبة 100%، وفي حال حدوث أي مشكلة أو خلل نقوم بتوفير بديل فوري أو حل المشكلة، بينما الحسابات الرخيصة في السوق غير آمنة ومقرصنة وتتعطل باستمرار دون تعويض.
- بخصوص الخصومات: يسمح بتقديم خصم 10% تلقائياً إذا طلب العميل أكثر من اشتراكين معاً، أو تقديم شهر مجاني إضافي عند تجديد الاشتراكات السنوية.
- بخصوص الضمان والدعم الفني: الضمان ذهبي وفوري ويشمل كامل فترة الاشتراك، وفريق الدعم الفني متواجد عبر واتساب لحل أي مشكلة خلال دقائق.
- بخصوص إتمام الدفع (Sales Detection): نقبل الدفع عبر (بنك فلسطين، بنك القدس، محفظة Jawwal Pay، أو PalPay، أو دفع نقدي عبر نقاط الشحن). إذا أرسل العميل صورة إيصال تحويل أو قال عبارة تدل على إتمام الدفع (مثل: حولت، تم الدفع، دفعت)، يجب إنشاء سجل مبيعات (Sale) فوراً بقيمة المنتج المستهدف وتحويل حالة العميل إلى "Customer".`
        }
      });
    }

    const count = await prisma.customer.count();
    if (count > 0) {
      return; // يوجد بيانات للعملاء بالفعل
    }

    console.log("🌱 Seeding database with mock WhatsApp CRM data for Alosh Store...");

    // 1. عميل 1: أحمد العتيبي - عميل حار جداً (Hot Lead)
    const customer1 = await prisma.customer.create({
      data: {
        name: "أحمد العتيبي",
        phone: "966501234567",
        status: "Hot Lead",
        leadScore: 85,
        purchaseProbability: 90.0,
        productsInterested: "اشتراك يوتيوب بريميوم سنة",
        lastSummary: "العميل مهتم جداً باشتراك يوتيوب بريميوم سنوي، طلب تفاصيل حساب بنك فلسطين لإجراء التحويل ونحن بانتظار التحويل.",
        followUpDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // غداً
        suggestedReply: "أهلاً بك يا فندم، بخصوص اشتراك يوتيوب بريميوم السنوي، أرسلت لك تفاصيل حساب بنك فلسطين بالأعلى. فور إرسال إيصال التحويل سنقوم بتفعيل الاشتراك على إيميلك الشخصي مباشرة وبدون إعلانات.",
      },
    });

    await prisma.customerMemory.create({
      data: {
        customerId: customer1.id,
        summary: "عميل يبحث عن التخلص من إعلانات يوتيوب، تفاعل مع عرض السعر (80 شيكل) وطلب الحساب البنكي مباشرة لتفعيل الخدمة سنواً.",
        interests: "اشتراك يوتيوب بريميوم سنة",
        objections: "استفسر عما إذا كان الاشتراك عائلياً أم شخصياً، وتم تأكيد أنه شخصي على إيميله وبشكل رسمي.",
        purchaseHistory: "لا يوجد مشتريات سابقة.",
      },
    });

    await prisma.aIEvent.create({
      data: {
        customerId: customer1.id,
        oldStatus: "New Lead",
        newStatus: "Interested",
        reason: "أبدى اهتماماً باشتراك يوتيوب بريميوم واستفسر عن السعر.",
        confidence: 80.0,
      },
    });

    await prisma.aIEvent.create({
      data: {
        customerId: customer1.id,
        oldStatus: "Interested",
        newStatus: "Hot Lead",
        reason: "العميل طلب تفاصيل التحويل وأكد رغبته بالدفع اليوم للاشتراك السنوي.",
        confidence: 94.0,
      },
    });

    await prisma.message.createMany({
      data: [
        {
          customerId: customer1.id,
          direction: "IN",
          messageType: "text",
          content: "السلام عليكم، كم سعر اشتراك يوتيوب بريميوم سنة كاملة؟",
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
        },
        {
          customerId: customer1.id,
          direction: "OUT",
          messageType: "text",
          content: "وعليكم السلام ورحمة الله وبركاته! أهلاً بك أ. أحمد. اشتراك يوتيوب بريميوم سنة كاملة بـ 80 شيكل فقط، ويتم التفعيل على إيميلك الشخصي بدون الحاجة للباسورد وضمان كامل طوال السنة.",
          timestamp: new Date(Date.now() - 2.8 * 60 * 60 * 1000),
        },
        {
          customerId: customer1.id,
          direction: "IN",
          messageType: "text",
          content: "حلو، هل هو اشتراك عائلي أم شاشة شخصية؟",
          timestamp: new Date(Date.now() - 2.5 * 60 * 60 * 1000),
        },
        {
          customerId: customer1.id,
          direction: "OUT",
          messageType: "text",
          content: "هذا اشتراك فردي رسمي خاص بك على إيميلك الشخصي، وليس عائلياً، مما يضمن خصوصية كاملة لقوائم التشغيل الخاصة بك.",
          timestamp: new Date(Date.now() - 2.4 * 60 * 60 * 1000),
        },
        {
          customerId: customer1.id,
          direction: "IN",
          messageType: "text",
          content: "تمام ممتاز جداً، أرسل لي رقم حساب بنك فلسطين لو سمحت عشان أحول الك اليوم.",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
        {
          customerId: customer1.id,
          direction: "OUT",
          messageType: "text",
          content: "على الرحب والسعة! هذا هو رقم الحساب (بنك فلسطين): 1234567 باسم علوش ستور. يرجى إرسال صورة إيصال التحويل هنا فور إتمامه لنقوم بتفعيل البريميوم على إيميلك فوراً.",
          timestamp: new Date(Date.now() - 1.8 * 60 * 60 * 1000),
        },
      ],
    });

    // 2. عميل 2: سارة الشمري - عميل فعلي تم تحويله تلقائياً (Customer)
    const customer2 = await prisma.customer.create({
      data: {
        name: "سارة الشمري",
        phone: "966502345678",
        status: "Customer",
        leadScore: 120,
        purchaseProbability: 100.0,
        productsInterested: "اشتراك IPTV لمدة 12 شهر",
        lastSummary: "تم إتمام عملية بيع اشتراك IPTV السنوي بنجاح بعد التحقق من إيصال التحويل بقيمة 120 شيكل.",
        suggestedReply: "أهلاً بكِ أ. سارة، تم تفعيل اشتراك IPTV السنوي الخاص بكِ بنجاح! تم إرسال بيانات الدخول وخادم التشغيل في رسالة خاصة، مشاهدة ممتعة ونحن في الخدمة دائماً.",
      },
    });

    await prisma.customerMemory.create({
      data: {
        customerId: customer2.id,
        summary: "عميلة مهتمة باشتراك القنوات المشفرة IPTV، استفسرت عن الجودة والثبات والدعم للمباريات وقامت بالتحويل والدفع الفوري (120 شيكل).",
        interests: "اشتراك IPTV لمدة 12 شهر",
        objections: "لا توجد اعتراضات تذكر.",
        purchaseHistory: "اشتراك IPTV سنوي - 120 شيكل",
      },
    });

    await prisma.aIEvent.create({
      data: {
        customerId: customer2.id,
        oldStatus: "New Lead",
        newStatus: "Customer",
        reason: "تم اكتشاف إتمام عملية الدفع والتحويل تلقائياً بقيمة 120 شيكل بعد إرسال العميلة لإيصال تحويل مصرفي معتمد.",
        confidence: 100.0,
      },
    });

    await prisma.message.createMany({
      data: [
        {
          customerId: customer2.id,
          direction: "IN",
          messageType: "text",
          content: "مرحبا، بدي اشتراك IPTV لمشاهدة قنوات بي ان سبورت والمباريات، هل البث ثابت؟",
          timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000),
        },
        {
          customerId: customer2.id,
          direction: "OUT",
          messageType: "text",
          content: "أهلاً بكِ أ. سارة. نعم السيرفر الخاص بنا ثابت جداً ويدعم جودات مختلفة (FHD, 4K, SD) ومقاوم للضغط أثناء المباريات الهامة. سعر الاشتراك السنوي هو 120 شيكل فقط.",
          timestamp: new Date(Date.now() - 9.8 * 60 * 60 * 1000),
        },
        {
          customerId: customer2.id,
          direction: "IN",
          messageType: "text",
          content: "ممتاز، هل يقبل الدفع عبر محفظة Jawwal Pay؟",
          timestamp: new Date(Date.now() - 9.5 * 60 * 60 * 1000),
        },
        {
          customerId: customer2.id,
          direction: "OUT",
          messageType: "text",
          content: "نعم بكل تأكيد! يمكنك التحويل مباشرة إلى رقم محفظتنا في جوال باي: 0599999999 باسم علوش ستور.",
          timestamp: new Date(Date.now() - 9.4 * 60 * 60 * 1000),
        },
        {
          customerId: customer2.id,
          direction: "IN",
          messageType: "text",
          content: "تم تحويل 120 شيكل، وهذا إثبات الدفع والتحويل.",
          timestamp: new Date(Date.now() - 9 * 60 * 60 * 1000),
        },
        {
          customerId: customer2.id,
          direction: "IN",
          messageType: "image",
          content: "[صورة] تحليل محتوى الصورة: هذه لقطة شاشة لإيصال تحويل مالي ناجح عبر تطبيق Jawwal Pay بقيمة 120 شيكل من حساب سارة الشمري لصالح علوش ستور، رقم المعاملة: 987654.",
          timestamp: new Date(Date.now() - 8.9 * 60 * 60 * 1000),
        },
      ],
    });

    await prisma.sale.create({
      data: {
        customerId: customer2.id,
        productName: "اشتراك IPTV لمدة 12 شهر",
        saleAmount: 120.0,
        isDetected: true,
        saleDate: new Date(Date.now() - 9 * 60 * 60 * 1000),
      },
    });

    // 3. عميل 3: خالد الحربي - مهتم ومتردد بسبب السعر (Interested)
    const customer3 = await prisma.customer.create({
      data: {
        name: "خالد الحربي",
        phone: "966503456789",
        status: "Interested",
        leadScore: 30,
        purchaseProbability: 45.0,
        productsInterested: "اشتراك ChatGPT Plus شهري",
        lastSummary: "العميل مهتم بالحصول على اشتراك ChatGPT Plus رسمي ولكنه يبدي تردداً بسبب السعر (90 شيكل) ويقارنه بحسابات مدمجة رخيصة.",
        suggestedReply: "أهلاً بك أ. خالد. حسابات ChatGPT Plus التي نقدمها هي حسابات رسمية 100% على إيميلك الخاص وتعمل بأعلى جودة وسرعة للذكاء الاصطناعي وبدون أي توقف. الحسابات المشتركة والرخيصة تتعطل باستمرار وتمسح سجلات المحادثات وتخترق الخصوصية. معنا ستحصل على كفاءة وضمان كامل طوال الشهر. هل نؤكد لك الاشتراك الرسمي الآن؟",
      },
    });

    await prisma.customerMemory.create({
      data: {
        customerId: customer3.id,
        summary: "العميل مبرمج يرغب باستخدام ChatGPT Plus لأعماله البرمجية، يقارن سعرنا (90 شيكل) بأسعار حسابات مشتركة رخيصة على الإنترنت (20 شيكل).",
        interests: "اشتراك ChatGPT Plus رسمي",
        objections: "السعر يعتبره مرتفعاً مقارنة بالحسابات المشتركة وغير الرسمية في السوق.",
        purchaseHistory: "لا يوجد مشتريات سابقة.",
      },
    });

    await prisma.aIEvent.create({
      data: {
        customerId: customer3.id,
        oldStatus: "New Lead",
        newStatus: "Interested",
        reason: "العميل سأل عن تفعيل ChatGPT Plus وأبدى اهتماماً لكنه أبدى اعتراضاً على القيمة.",
        confidence: 70.0,
      },
    });

    await prisma.message.createMany({
      data: [
        {
          customerId: customer3.id,
          direction: "IN",
          messageType: "text",
          content: "السلام عليكم، بكم تفعيل اشتراك ChatGPT Plus؟ وهل الحساب خاص فيني؟",
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
        {
          customerId: customer3.id,
          direction: "OUT",
          messageType: "text",
          content: "وعليكم السلام ورحمة الله! أهلاً بك أ. خالد. نعم الحساب رسمي وخاص بك 100% على إيميلك، سعره 90 شيكل شهرياً شامل الضريبة وضمان كامل.",
          timestamp: new Date(Date.now() - 23.5 * 60 * 60 * 1000),
        },
        {
          customerId: customer3.id,
          direction: "IN",
          messageType: "text",
          content: "90 شيكل غالي الصراحة، حصلت ناس بتبيعه بـ 25 شيكل في مجموعات الفيس. ليش السعر عندكم مرتفع؟",
          timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000),
        },
      ],
    });

    // 4. عميل 4: فهد القحطاني - يحتاج متابعة اليوم (Follow Up Later)
    const customer4 = await prisma.customer.create({
      data: {
        name: "فهد القحطاني",
        phone: "966504567890",
        status: "Follow Up Later",
        leadScore: 50,
        purchaseProbability: 65.0,
        productsInterested: "اشتراك شاهد VIP الرياضي سنوي",
        lastSummary: "طلب العميل تأجيل تأكيد الاشتراك لحين نزول راتبه، المتابعة مطلوبة اليوم لتأكيد حجز اشتراك شاهد الرياضي السنوي بـ 180 شيكل.",
        followUpDate: new Date(), // اليوم
        suggestedReply: "أهلاً بك أ. فهد، تواصلنا معك اليوم بناءً على طلبك السابق لمتابعة وتفعيل اشتراك شاهد VIP الرياضي السنوي (بـ 180 شيكل). هل ترغب في إرسال تفاصيل محفظة جوال باي أو الحساب البنكي لإتمام التفعيل؟",
      },
    });

    await prisma.customerMemory.create({
      data: {
        customerId: customer4.id,
        summary: "العميل يرغب في الاشتراك السنوي لمشاهدة الدوري السعودي والبطولات، وافق على السعر ولكنه ينتظر الراتب للتفعيل.",
        interests: "اشتراك شاهد VIP الرياضي سنوي",
        objections: "المشكلة كانت فقط في توافر الميزانية في ذلك الوقت بسبب تأخر الراتب.",
        purchaseHistory: "لا يوجد مشتريات سابقة.",
      },
    });

    await prisma.aIEvent.create({
      data: {
        customerId: customer4.id,
        oldStatus: "New Lead",
        newStatus: "Follow Up Later",
        reason: "العميل مهتم جداً ووافق على الخدمة ولكنه طلب إرجاء الدفع والمتابعة لليوم.",
        confidence: 85.0,
      },
    });

    await prisma.message.createMany({
      data: [
        {
          customerId: customer4.id,
          direction: "IN",
          messageType: "text",
          content: "السلام عليكم، بدي اشتراك شاهد الرياضي السنوي، كم السعر وطريقة التفعيل؟",
          timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        },
        {
          customerId: customer4.id,
          direction: "OUT",
          messageType: "text",
          content: "وعليكم السلام ورحمة الله! أهلاً بك أ. فهد. الاشتراك السنوي للباقة الرياضية شاهد VIP هو 180 شيكل فقط بدلاً من 240 شيكل. التفعيل فوري ومضمون.",
          timestamp: new Date(Date.now() - 3.8 * 24 * 60 * 60 * 1000),
        },
        {
          customerId: customer4.id,
          direction: "IN",
          messageType: "text",
          content: "العرض ممتاز، بس الراتب بنزل الأسبوع القادم، بتقدروا تكلموني يوم الأربعاء عشان أحولكم ونفعل؟",
          timestamp: new Date(Date.now() - 3.5 * 24 * 60 * 60 * 1000),
        },
      ],
    });

    // 5. عميل 5: محمد الدوسري - عميل خاسر (Lost Customer)
    const customer5 = await prisma.customer.create({
      data: {
        name: "محمد الدوسري",
        phone: "966505678901",
        status: "Lost Customer",
        leadScore: 10,
        purchaseProbability: 5.0,
        productsInterested: "اشتراك أدوبي كرييتف كلاود سنة",
        lastSummary: "تم تصنيف العميل كعميل خاسر بسبب طلبه الحصول على تفعيل مدى الحياة لمنتجات أدوبي (وهو غير متوفر كونه نظام اشتراك سنوي رسمي).",
        suggestedReply: "نشكرك أ. محمد لتوضيح رغبتك. حزمة أدوبي كرييتف كلاود هي اشتراك رسمي يجدد سنوياً من الشركة ولا تتوفر منه نسخة قانونية 'مدى الحياة'. يؤسفنا عدم توفير طلبك ويسعدنا خدمتك بأي وقت آخر.",
      },
    });

    await prisma.customerMemory.create({
      data: {
        customerId: customer5.id,
        summary: "العميل مصمم جرافيك، يبحث عن تفعيل مدى الحياة لحزمة أدوبي Creative Cloud بدون دفع اشتراكات متكررة.",
        interests: "تفعيل أدوبي مدى الحياة",
        objections: "يرفض مبدأ الدفع السنوي (250 شيكل) ويبحث عن حلول مهكرة غير رسمية.",
        purchaseHistory: "لا يوجد.",
      },
    });

    await prisma.aIEvent.create({
      data: {
        customerId: customer5.id,
        oldStatus: "New Lead",
        newStatus: "Lost Customer",
        reason: "العميل أكد أنه لا يرغب بالاشتراكات السنوية المتجددة ويبحث عن نسخة مدى الحياة مفعلة بكرك أو كود دائم.",
        confidence: 98.0,
      },
    });

    await prisma.message.createMany({
      data: [
        {
          customerId: customer5.id,
          direction: "IN",
          messageType: "text",
          content: "السلام عليكم، بدي برنامج الفوتوشوب والإليستريتور تفعيل مدى الحياة بدون اشتراك سنوي، متوفر؟",
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        },
        {
          customerId: customer5.id,
          direction: "OUT",
          messageType: "text",
          content: "وعليكم السلام ورحمة الله. نوفر اشتراك رسمي متكامل لـ أدوبي كرييتف كلاود يربط بإيميلك الشخصي لمدة سنة بـ 250 شيكل. لا نوفر نسخ مهكرة أو تفعيلات مدى الحياة حفاظاً على أمان ملفاتك ونظامك.",
          timestamp: new Date(Date.now() - 4.8 * 24 * 60 * 60 * 1000),
        },
        {
          customerId: customer5.id,
          direction: "IN",
          messageType: "text",
          content: "اها، لا أنا ما بدي دفع سنوي كل مرة، بفتش على كراك أو تفعيل للأبد. شكراً الك.",
          timestamp: new Date(Date.now() - 4.5 * 24 * 60 * 60 * 1000),
        },
      ],
    });

    console.log("🌱 Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  }
}
