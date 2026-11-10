(function () {
  'use strict';

  var articles = {
    'violences-ecouter-sans-juger': {
      category: 'Novembre 2026 · Prévention',
      title: 'Violences faites aux femmes : écouter sans juger',
      image: 'img/evenement/novembre/1.jpg',
      alt: 'Échange entre femmes autour de leurs droits',
      intro: 'Lorsqu’une femme confie une situation de violence, l’écoute peut être un premier soutien. Accueillir sa parole avec respect, sans la blâmer ni décider à sa place, l’aide à ne pas rester seule.',
      paragraphs: [
        'Écouter, c’est laisser la personne raconter ce qu’elle souhaite, à son rythme. Évitez les questions accusatrices comme « pourquoi n’es-tu pas partie ? » et préférez des paroles simples : « je te crois », « tu ne mérites pas cela » ou « comment puis-je t’aider ? ».',
        'Respecter ses choix est essentiel. Ne la forcez pas à porter plainte, à quitter son domicile ou à raconter son histoire à d’autres. Vous pouvez lui demander si elle se sent en sécurité maintenant et si elle souhaite être mise en contact avec une structure spécialisée.',
        'Si elle est en danger immédiat, aidez-la à contacter les services d’urgence ou les dispositifs d’aide disponibles dans sa région, en tenant compte de sa sécurité et de ses souhaits. Ne confrontez pas la personne violente : cela pourrait accroître le risque.'
      ],
      takeaway: 'Croire, écouter sans jugement et proposer des options sans imposer de décision sont des gestes de soutien.',
      tags: ['Violences faites aux femmes', 'Écoute', 'Prévention']
    },
    'violences-reperer-controle': {
      category: 'Novembre 2026 · S’informer',
      title: 'Contrôle, isolement, menaces : des signaux à prendre au sérieux',
      image: 'img/evenement/novembre/2.jpg',
      alt: 'Intervenante partageant des informations lors d’un échange',
      intro: 'La violence ne se limite pas aux blessures visibles. Le contrôle répété, les menaces, l’humiliation ou l’isolement imposé peuvent aussi affecter la liberté, la sécurité et le bien-être d’une femme.',
      paragraphs: [
        'Un comportement préoccupant peut notamment consister à surveiller les déplacements ou les communications, empêcher les contacts avec les proches, contrôler l’argent ou utiliser des menaces pour imposer une décision. Un signe isolé ne permet pas à lui seul de qualifier toute une situation : c’est le contexte, la répétition et le sentiment de sécurité de la personne qui comptent.',
        'Si vous êtes concernée, vous pouvez en parler à une personne de confiance ou demander conseil à une structure spécialisée dans l’accompagnement des femmes. Si cela peut être fait sans risque, notez les faits importants et gardez les coordonnées utiles dans un endroit sûr.',
        'Ne vous mettez pas en danger pour obtenir des preuves ou confronter la personne concernée. En cas de danger immédiat, contactez les services d’urgence ou les ressources d’aide disponibles dans votre région.'
      ],
      takeaway: 'Vous n’avez pas à déterminer seule le nom de ce que vous vivez pour demander conseil et soutien.',
      tags: ['Violences faites aux femmes', 'Signaux d’alerte', 'Sécurité']
    },
    'soutenir-une-femme': {
      category: 'Novembre 2026 · Entraide',
      title: 'Comment soutenir une femme confrontée à la violence',
      image: 'img/evenement/novembre/3.jpg',
      alt: 'Femmes réunies dans un espace de dialogue et d’écoute',
      intro: 'Soutenir une femme confrontée à la violence, c’est lui rappeler qu’elle n’est pas seule, tout en respectant son rythme, ses choix et les précautions nécessaires à sa sécurité.',
      paragraphs: [
        'Proposez une écoute discrète et demandez ce qui lui serait utile aujourd’hui. Elle peut avoir besoin d’être crue, d’un accompagnement pour chercher une structure spécialisée ou simplement d’un espace où parler sans pression.',
        'Évitez de partager son histoire sans son accord, de la culpabiliser ou de lui imposer une démarche. Ne contactez pas la personne violente et ne laissez pas de messages qui pourraient être lus par elle sans vérifier avec la femme concernée ce qui est sûr.',
        'Vous pouvez l’aider à rechercher les services d’aide et les professionnels compétents disponibles dans sa région. Si le danger est immédiat, orientez-vous vers les services d’urgence locaux et privilégiez un moyen de communication qui ne compromet pas sa sécurité.'
      ],
      takeaway: 'Le soutien le plus utile est celui qui écoute, protège la confidentialité et laisse à la femme le pouvoir de décider.',
      tags: ['Entraide', 'Accompagnement', 'Sécurité']
    },
    'oser-etre-soi': {
      category: 'Former',
      title: 'Oser apprendre, c’est déjà avancer',
      image: 'img/galerie/formations/1.jpeg',
      alt: 'Femmes réunies pendant une formation entrepreneuriale',
      intro: 'Apprendre ne consiste pas seulement à accumuler des connaissances. C’est aussi découvrir ses ressources, gagner confiance et se donner le droit d’imaginer de nouvelles possibilités.',
      paragraphs: [
        'Chaque femme arrive avec un parcours, des savoirs et des talents qui lui sont propres. Une formation peut aider à les reconnaître, à les développer et à les mettre au service de projets qui ont du sens pour elle.',
        'Il n’est pas nécessaire de tout maîtriser avant de commencer. Poser une question, essayer une nouvelle méthode ou demander conseil sont déjà des gestes d’apprentissage. On peut avancer à son rythme et revenir sur une notion autant de fois que nécessaire.',
        'Pour choisir un prochain apprentissage, partez d’une question concrète : qu’aimeriez-vous mieux comprendre ou savoir faire ? Ensuite, cherchez une personne, un atelier ou une ressource fiable qui peut vous aider à faire un premier pas.'
      ],
      takeaway: 'Votre expérience est déjà une base. Apprendre, c’est lui ajouter de nouvelles possibilités.',
      tags: ['Formation', 'Confiance', 'Autonomisation']
    },
    'prendre-sa-place': {
      category: 'Éveiller',
      title: 'Prendre sa place : la voix des femmes compte',
      image: 'img/evenement/novembre/5.jpg',
      alt: 'Intervenante partageant ses idées lors d’un échange',
      intro: 'Une parole qui se fait entendre peut ouvrir une conversation, faire connaître un besoin et participer aux décisions. La voix des femmes compte dans tous les espaces où se construit la vie collective.',
      paragraphs: [
        'Il arrive que l’on hésite à prendre la parole, par crainte de ne pas être assez légitime ou de ne pas trouver les mots justes. Pourtant, une expérience vécue et une question sincère ont toute leur place dans un échange.',
        'Écouter les femmes, c’est aussi reconnaître qu’elles sont concernées au premier plan par les choix qui touchent leur santé, leurs droits et leur avenir. Leur participation ne devrait pas être une exception, mais une habitude.',
        'Une astuce pour commencer : préparez une idée ou une question avant une réunion, puis partagez-la simplement. Vous pouvez aussi vous appuyer sur une personne de confiance et proposer un espace où chacune peut s’exprimer à son tour.'
      ],
      takeaway: 'Votre point de vue a de la valeur. Le partager peut aider d’autres femmes à faire entendre le leur.',
      tags: ['Prise de parole', 'Écoute', 'Droits des femmes']
    },
    'petits-pas': {
      category: 'Conseils',
      title: 'Un projet se construit aussi par petits pas',
      image: 'img/evenement/novembre/4.jpg',
      alt: 'Participantes échangeant pendant une formation',
      intro: 'Une idée peut sembler trop grande lorsqu’on essaie de tout réaliser en même temps. La découper en étapes accessibles aide à passer de l’envie à l’action.',
      paragraphs: [
        'Commencez par écrire votre idée en une phrase. À qui s’adresse-t-elle ? Quel besoin cherche-t-elle à répondre ? Ces questions permettent de préciser ce que vous souhaitez faire, sans avoir à tout résoudre immédiatement.',
        'Choisissez ensuite une petite action que vous pouvez réaliser avec les moyens disponibles : en parler à une personne concernée, recueillir quelques avis ou vous renseigner sur un sujet précis. Les retours vous aideront à ajuster la suite.',
        'Gardez une trace de vos avancées et de ce que vous apprenez. Les étapes peuvent évoluer, et demander de l’aide n’enlève rien à votre initiative : cela peut au contraire la rendre plus solide.'
      ],
      takeaway: 'Un premier pas réaliste vaut mieux qu’un plan parfait qui reste dans un tiroir.',
      tags: ['Conseils', 'Projets', 'Entrepreneuriat']
    },
    'connaitre-ses-droits': {
      category: 'Droits',
      title: 'Connaître ses droits pour mieux les exercer',
      image: 'img/evenement/novembre/6.jpg',
      alt: 'Femmes réunies pour échanger autour de leurs droits',
      intro: 'Les droits prennent tout leur sens lorsque les personnes peuvent les connaître, poser des questions et chercher les informations nécessaires pour les faire respecter.',
      paragraphs: [
        'S’informer est une première étape. Lorsqu’une situation nous concerne, il peut être utile de noter ses questions, de chercher une source fiable et de demander des explications à une personne ou à un service compétent.',
        'Les échanges entre femmes peuvent aider à faire circuler des informations et à rompre l’isolement. Ils ne remplacent pas un conseil professionnel, mais peuvent orienter vers des ressources et encourager à chercher un accompagnement adapté.',
        'Si une information semble importante, prenez le temps d’en vérifier l’origine et la date. En cas de doute sur une démarche ou sur une situation personnelle, adressez-vous à une structure qualifiée dans votre région.'
      ],
      takeaway: 'S’informer, vérifier et demander de l’aide sont des démarches légitimes pour faire valoir ses droits.',
      tags: ['Droits', 'Information', 'Entraide']
    },
    'sante-ecoute': {
      category: 'Santé',
      title: 'Notre santé mérite d’être écoutée',
      image: 'img/evenement/novembre/7.jpg',
      alt: 'Campagne Octobre Rose : notre santé, notre droit',
      intro: 'Pouvoir parler de sa santé, être écoutée et recevoir une information compréhensible sont essentiels pour faire des choix éclairés.',
      paragraphs: [
        'Il n’y a pas de question inutile lorsqu’il s’agit de son bien-être. Noter ses préoccupations avant un rendez-vous peut aider à ne rien oublier et à expliquer plus clairement ce que l’on ressent.',
        'Les informations sur la santé ne se valent pas toutes. Privilégiez les sources reconnues et les conseils des professionnels de santé. Une publication partagée en ligne ne remplace pas un avis adapté à votre situation.',
        'Prendre soin de soi ne signifie pas devoir tout gérer seule. Demander de l’aide, se faire accompagner ou solliciter une explication supplémentaire sont aussi des façons de prendre sa santé au sérieux.'
      ],
      takeaway: 'Votre santé vous concerne : vous avez le droit de poser des questions et de demander une information claire.',
      tags: ['Santé des femmes', 'Écoute', 'Information fiable']
    },
    'bien-etre-sans-culpabilite': {
      category: 'Bien-être',
      title: 'Prendre soin de soi sans culpabiliser',
      image: 'img/evenement/novembre/8.jpg',
      alt: 'Participante à une rencontre d’échange entre femmes',
      intro: 'Prendre soin de soi n’est pas un luxe ni un manque de considération pour les autres. C’est reconnaître que ses propres besoins méritent aussi de l’attention.',
      paragraphs: [
        'Les journées peuvent être remplies de responsabilités. Au milieu de ces demandes, il est parfois difficile de remarquer sa fatigue ou de s’accorder une pause. Pourtant, écouter ses limites permet de mieux comprendre ce dont on a besoin.',
        'Le bien-être n’a pas une seule forme. Cela peut être un moment de repos, une conversation avec une personne de confiance, une activité qui fait du bien ou le fait de demander du soutien.',
        'Essayez de choisir un petit geste réaliste pour cette semaine, sans vous comparer aux autres. Si vous traversez une période difficile, parler à une personne de confiance ou à un professionnel peut aider.'
      ],
      takeaway: 'Vous avez le droit de prendre soin de vous, même lorsque beaucoup de personnes comptent sur vous.',
      tags: ['Bien-être', 'Santé mentale', 'Équilibre']
    },
    'sororite': {
      category: 'Ensemble',
      title: 'La sororité : avancer sans se comparer',
      image: 'img/evenement/novembre/9.jpg',
      alt: 'Femmes partageant un moment de discussion',
      intro: 'L’entraide entre femmes ne demande pas de suivre le même chemin. Elle consiste à se reconnaître, à s’encourager et à laisser à chacune la liberté d’avancer à sa manière.',
      paragraphs: [
        'La comparaison peut faire oublier que les parcours, les ressources et les contraintes diffèrent. Écouter sans juger et célébrer les progrès, même modestes, contribuent à des relations plus solidaires.',
        'Un geste d’entraide peut être simple : partager une information vérifiée, recommander une ressource, prendre le temps d’écouter ou reconnaître le travail d’une autre femme.',
        'La solidarité n’efface pas les désaccords. Elle permet de les traverser avec respect et de chercher des solutions qui ne diminuent pas la dignité de l’une ou de l’autre.'
      ],
      takeaway: 'L’avancée d’une autre femme ne réduit pas la vôtre : nous pouvons progresser ensemble.',
      tags: ['Sororité', 'Entraide', 'Solidarité']
    },
    'oser-entreprendre': {
      category: 'Autonomisation',
      title: 'Entreprendre : commencer avec ce que l’on a',
      image: 'img/evenement/novembre/11.jpg',
      alt: 'Groupe de participantes à une formation entrepreneuriale',
      intro: 'Entreprendre peut commencer par une idée, une compétence ou un besoin que l’on souhaite résoudre. Il est possible d’explorer cette idée avant d’avoir toutes les réponses.',
      paragraphs: [
        'Prenez le temps de décrire le besoin auquel votre projet veut répondre et les personnes qu’il pourrait concerner. Une première discussion avec elles peut vous apprendre ce qui leur serait réellement utile.',
        'Faites l’inventaire de vos ressources actuelles : savoir-faire, temps disponible, matériel ou personnes prêtes à échanger. Cela permet d’imaginer une première étape adaptée à votre situation.',
        'Renseignez-vous sur les démarches, les coûts et les soutiens possibles auprès de sources compétentes. Avancer progressivement et réévaluer son idée font partie de la construction d’un projet.'
      ],
      takeaway: 'Vous n’avez pas besoin d’attendre que tout soit parfait pour commencer à explorer votre idée.',
      tags: ['Entrepreneuriat', 'Autonomie', 'Initiative']
    },
    'apprendre-toute-vie': {
      category: 'Former',
      title: 'Apprendre à tout âge, à son rythme',
      image: 'img/evenement/novembre/10.jpg',
      alt: 'Participante prenant la parole pendant une formation',
      intro: 'L’apprentissage ne s’arrête pas à une étape de la vie. Il peut accompagner les changements, nourrir la curiosité et aider chacune à se sentir plus à l’aise dans ses choix.',
      paragraphs: [
        'On peut apprendre de différentes façons : en suivant une formation, en observant une personne expérimentée, en lisant une ressource fiable ou en pratiquant avec d’autres.',
        'Pour garder le cap, choisissez un objectif concret et adapté à votre disponibilité. Quelques minutes régulières peuvent aider à progresser, surtout si vous prenez le temps de revenir sur ce que vous avez découvert.',
        'N’hésitez pas à demander des explications ou à reprendre une notion. Apprendre à son rythme n’est pas prendre du retard : c’est trouver une manière de progresser qui vous convient.'
      ],
      takeaway: 'Chaque nouvelle compétence, même petite, peut devenir une ressource pour la suite.',
      tags: ['Apprentissage', 'Formation', 'Confiance']
    }
  };

  var requestedId = new URLSearchParams(window.location.search).get('article');
  var article = articles[requestedId];

  if (!article) {
    window.location.replace('blog.html');
    return;
  }

  document.title = article.title + ' — Mwinue Asimame';
  document.getElementById('articleDescription').content = article.intro;
  document.getElementById('articleCategory').textContent = article.category;
  document.getElementById('articleTitle').textContent = article.title;
  document.getElementById('articleBreadcrumb').textContent = article.title;
  document.getElementById('articleImage').src = article.image;
  document.getElementById('articleImage').alt = article.alt;
  document.getElementById('articleIntro').textContent = article.intro;
  document.getElementById('articleTakeaway').textContent = article.takeaway;
  var articleDate = document.getElementById('articleDate');
  if (article.category.startsWith('Novembre 2026')) {
    articleDate.textContent = '· Novembre 2026';
    articleDate.hidden = false;
  }

  var body = document.getElementById('articleBody');
  article.paragraphs.forEach(function (text, index) {
    if (index === 1) {
      var heading = document.createElement('h3');
      heading.className = 'mb-3';
      heading.textContent = 'Une piste pour avancer';
      body.appendChild(heading);
    }

    var paragraph = document.createElement('p');
    paragraph.className = 'mb-4';
    paragraph.textContent = text;
    body.appendChild(paragraph);
  });

  var tags = document.getElementById('articleTags');
  article.tags.forEach(function (tag) {
    var badge = document.createElement('span');
    badge.className = 'badge-soft';
    badge.textContent = tag;
    tags.appendChild(badge);
  });
})();
