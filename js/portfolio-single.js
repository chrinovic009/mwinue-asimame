(function () {
  'use strict';

  var photos = [
    {
      id: 'sante-1',
      image: 'img/galerie/sante/1.jpeg',
      category: 'Santé',
      theme: 'Sensibilisation au cancer du sein',
      title: 'Campagne de sensibilisation au cancer du sein',
      alt: 'Rencontre de sensibilisation au cancer du sein',
      intro: 'Cette photographie montre des participantes réunies autour d’une action de sensibilisation au cancer du sein, portée par Mwinue Asimame.',
      storyTitle: 'Informer et sensibiliser sur le cancer du sein',
      story1: 'La rencontre offre un espace pour partager des informations et attirer l’attention sur la santé des femmes. Les rubans roses visibles rappellent l’importance de parler du cancer du sein et de la prévention.',
      story2: 'À travers ses campagnes, Mwinue Asimame encourage les femmes à s’informer et à demander conseil à des professionnels de santé.',
      closing: 'La sensibilisation et l’accès à une information fiable contribuent à faire de la santé des femmes une priorité.',
      facts: ['Santé des femmes', 'Prévention', 'Sensibilisation'],
      tags: ['Santé', 'Prévention', 'Cancer du sein']
    },
    {
      id: 'droits-1',
      image: 'img/galerie/droits/1.jpeg',
      category: 'Droits',
      theme: 'Charge mentale',
      title: 'Une rencontre consacrée à la charge mentale',
      alt: 'Intervenante prenant la parole lors d’un échange sur la charge mentale',
      intro: 'Une intervenante s’adresse aux participantes au cours d’une rencontre consacrée à la charge mentale des femmes.',
      storyTitle: 'Mettre des mots sur la charge mentale',
      story1: 'Cette rencontre crée un temps d’écoute et de partage autour des responsabilités et des pressions que les femmes peuvent porter au quotidien.',
      story2: 'Les échanges invitent à reconnaître ces réalités, à partager les expériences et à réfléchir à des moyens de préserver son équilibre.',
      closing: 'Le bien-être des femmes mérite une attention qui ne se limite pas aux attentes placées sur elles.',
      facts: ['Échanges', 'Écoute', 'Bien-être des femmes'],
      tags: ['Droits', 'Charge mentale', 'Bien-être']
    },
    {
      id: 'formations-1',
      image: 'img/galerie/formations/1.jpeg',
      category: 'Autonomisation',
      theme: 'Formation entrepreneuriale',
      title: 'Formation entrepreneuriale',
      alt: 'Intervenante s’exprimant devant les participantes à une formation entrepreneuriale',
      intro: 'Une intervenante prend la parole au cours d’une formation entrepreneuriale organisée dans le cadre des initiatives de Mwinue Asimame.',
      storyTitle: 'Renforcer les capacités entrepreneuriales',
      story1: 'La formation met les participantes en contact avec des contenus et des échanges autour de l’entrepreneuriat.',
      story2: 'Ce temps collectif valorise le partage d’expériences et la possibilité pour chacune de développer ses capacités et ses projets.',
      closing: 'L’autonomisation passe aussi par l’accès aux connaissances et aux occasions de se former.',
      facts: ['Formation', 'Entrepreneuriat', 'Renforcement des capacités'],
      tags: ['Autonomisation', 'Formation', 'Entrepreneuriat']
    },
    {
      id: 'droits-2',
      image: 'img/galerie/droits/2.jpeg',
      category: 'Droits',
      theme: 'Charge mentale',
      title: 'Une rencontre consacrée à la charge mentale',
      alt: 'Participantes attentives lors d’une rencontre autour de la charge mentale',
      intro: 'Les participantes prennent part à une rencontre d’échange consacrée à la charge mentale et au vécu des femmes.',
      storyTitle: 'Un espace d’écoute et de partage',
      story1: 'La rencontre permet d’accueillir les paroles et les expériences des participantes, et d’aborder les pressions qui peuvent peser sur leur quotidien.',
      story2: 'En partageant leurs points de vue, les femmes peuvent mieux faire reconnaître ces réalités et réfléchir ensemble à leur bien-être.',
      closing: 'S’écouter et échanger aide à faire du bien-être des femmes un sujet de dialogue.',
      facts: ['Rencontre', 'Partage d’expériences', 'Écoute'],
      tags: ['Droits', 'Charge mentale', 'Échanges']
    },
    {
      id: 'sante-2',
      image: 'img/galerie/sante/2.jpeg',
      category: 'Santé',
      theme: 'Sensibilisation au cancer du sein',
      title: 'Campagne de sensibilisation au cancer du sein',
      alt: 'Participantes réunies lors d’une action de sensibilisation au cancer du sein',
      intro: 'Cette image montre les participantes réunies lors d’une action de sensibilisation au cancer du sein.',
      storyTitle: 'Une mobilisation autour de la santé des femmes',
      story1: 'La présence de participantes venues écouter et échanger illustre l’importance de créer des espaces où les questions de santé peuvent être abordées.',
      story2: 'La campagne rappelle l’intérêt de s’informer sur le cancer du sein et d’échanger avec des professionnels de santé en cas de question ou d’inquiétude.',
      closing: 'La prévention commence aussi par une information accessible et des échanges sans tabou.',
      facts: ['Santé des femmes', 'Information', 'Prévention'],
      tags: ['Santé', 'Cancer du sein', 'Sensibilisation']
    },
    {
      id: 'formations-2',
      image: 'img/galerie/formations/2.jpeg',
      category: 'Autonomisation',
      theme: 'Formation entrepreneuriale',
      title: 'Formation entrepreneuriale',
      alt: 'Intervenante partageant des informations pendant une formation entrepreneuriale',
      intro: 'Une intervenante partage des informations avec les participantes d’une formation entrepreneuriale.',
      storyTitle: 'Apprendre et avancer ensemble',
      story1: 'La formation rassemble des participantes autour de l’apprentissage et du partage de connaissances liées à l’entrepreneuriat.',
      story2: 'Ces moments peuvent aider les femmes à nourrir leurs idées et à renforcer leurs capacités dans la réalisation de leurs projets.',
      closing: 'La formation est un levier pour encourager la confiance, l’initiative et l’autonomie.',
      facts: ['Apprentissage', 'Entrepreneuriat', 'Initiative'],
      tags: ['Autonomisation', 'Formation', 'Projets']
    },
    {
      id: 'droits-3',
      image: 'img/galerie/droits/3.jpeg',
      category: 'Droits',
      theme: 'Droits des femmes',
      title: 'Un espace d’échange consacré aux droits des femmes',
      alt: 'Femmes réunies pour échanger dans un cadre de rencontre',
      intro: 'Des femmes sont réunies dans un cadre d’échange consacré aux réalités et aux droits des femmes.',
      storyTitle: 'Faire une place à la parole des femmes',
      story1: 'Les espaces de dialogue permettent de partager les expériences et de mieux faire connaître les sujets qui touchent les droits et le quotidien des femmes.',
      story2: 'L’écoute et la circulation d’informations contribuent à ce que chacune puisse mieux comprendre les enjeux et faire entendre sa voix.',
      closing: 'La défense des droits passe aussi par des espaces où les femmes peuvent s’informer et s’exprimer.',
      facts: ['Droits', 'Dialogue', 'Participation'],
      tags: ['Droits des femmes', 'Échanges', 'Information']
    },
    {
      id: 'sante-3',
      image: 'img/galerie/sante/3.jpeg',
      category: 'Santé',
      theme: 'Octobre Rose',
      title: 'Campagne de sensibilisation au cancer du sein',
      alt: 'Campagne Octobre Rose portant le message Notre santé, notre droit',
      intro: 'Le visuel Octobre Rose rappelle que la santé des femmes est un droit et qu’elles doivent pouvoir être écoutées, informées et soignées.',
      storyTitle: 'Notre santé, notre droit',
      story1: 'La campagne met en avant la sensibilisation au cancer du sein et l’importance de placer les femmes au cœur des décisions qui concernent leur santé.',
      story2: 'Être écoutée, informée et accompagnée contribue à mieux comprendre les enjeux de prévention et à s’orienter vers des soins adaptés.',
      closing: 'La sensibilisation au cancer du sein s’inscrit dans un engagement plus large en faveur du droit à la santé.',
      facts: ['Octobre Rose', 'Droit à la santé', 'Prévention'],
      tags: ['Santé', 'Octobre Rose', 'Droits']
    },
    {
      id: 'formations-3',
      image: 'img/galerie/formations/3.jpeg',
      category: 'Autonomisation',
      theme: 'Formation entrepreneuriale',
      title: 'Formation entrepreneuriale',
      alt: 'Participante prenant la parole pendant une formation entrepreneuriale',
      intro: 'Une participante prend la parole au cours d’une activité de formation entrepreneuriale.',
      storyTitle: 'Encourager l’initiative et le partage',
      story1: 'Les temps de formation favorisent la transmission de connaissances et donnent aux participantes l’occasion de prendre part activement aux échanges.',
      story2: 'La participation et le partage d’idées soutiennent le développement de projets et le renforcement des capacités.',
      closing: 'Mwinue Asimame encourage les initiatives qui contribuent à l’autonomie des femmes.',
      facts: ['Participation', 'Entrepreneuriat', 'Autonomie'],
      tags: ['Autonomisation', 'Formation', 'Initiative']
    },
    {
      id: 'sante-4',
      image: 'img/galerie/sante/4.jpeg',
      category: 'Santé',
      theme: 'Professionnelles de la santé',
      title: "Avec l'association des femmes professionnelles de la santé",
      alt: 'Femmes professionnelles de la santé réunies lors d’une rencontre',
      intro: 'Cette photographie présente des femmes réunies dans le cadre d’une rencontre avec l’association des femmes professionnelles de la santé.',
      storyTitle: 'La santé portée par les femmes',
      story1: 'La présence de professionnelles de la santé met en lumière le rôle des femmes engagées dans les domaines du soin et de la santé.',
      story2: 'Ces échanges favorisent les liens et la mobilisation autour des enjeux de santé qui concernent les femmes et les communautés.',
      closing: 'La collaboration et la reconnaissance de l’expertise des femmes contribuent à faire progresser la santé.',
      facts: ['Professionnelles', 'Santé', 'Collaboration'],
      tags: ['Santé', 'Professionnelles', 'Engagement']
    },
    {
      id: 'droits-4',
      image: 'img/galerie/droits/4.jpeg',
      category: 'Droits',
      theme: 'Charge mentale',
      title: 'Une rencontre consacrée à la charge mentale',
      alt: 'Portrait d’une participante lors d’une rencontre sur la charge mentale',
      intro: 'Le portrait d’une participante témoigne de l’écoute et de l’attention portées aux femmes lors d’une rencontre consacrée à la charge mentale.',
      storyTitle: 'Écouter les réalités vécues',
      story1: 'Parler de charge mentale permet de reconnaître les responsabilités et les pressions qui peuvent affecter l’équilibre et le bien-être des femmes.',
      story2: 'La rencontre donne une place aux témoignages et encourage le partage de pistes pour prendre soin de soi.',
      closing: 'Chaque femme mérite un espace où son expérience peut être entendue avec attention.',
      facts: ['Charge mentale', 'Écoute', 'Bien-être'],
      tags: ['Droits', 'Charge mentale', 'Santé mentale']
    },
    {
      id: 'formations-4',
      image: 'img/galerie/formations/4.jpeg',
      category: 'Autonomisation',
      theme: 'Formation entrepreneuriale',
      title: 'Formation entrepreneuriale',
      alt: 'Participante assistant à une formation entrepreneuriale',
      intro: 'Une participante suit une session de formation entrepreneuriale organisée par Mwinue Asimame.',
      storyTitle: 'Se former pour développer ses projets',
      story1: 'La formation entrepreneuriale offre un cadre d’apprentissage et de réflexion autour des projets et des initiatives des femmes.',
      story2: 'La participation à ces activités permet de renforcer les connaissances et de s’inspirer des échanges avec les autres participantes.',
      closing: 'L’accès à la formation soutient l’autonomisation et l’épanouissement des femmes.',
      facts: ['Formation', 'Projets', 'Autonomisation'],
      tags: ['Autonomisation', 'Entrepreneuriat', 'Apprentissage']
    },
    {
      id: 'sante-5',
      image: 'img/galerie/sante/5.jpeg',
      category: 'Santé',
      theme: 'Sensibilisation aux cancers',
      title: 'Unis contre les cancers : de la sensibilisation à l’action',
      alt: 'Groupe réuni lors d’une mobilisation de sensibilisation contre les cancers',
      intro: 'Des participantes et des partenaires sont réunis autour d’une mobilisation de sensibilisation contre les cancers.',
      storyTitle: 'De la sensibilisation à l’action',
      story1: 'Le message de la campagne appelle à unir les efforts pour mieux faire connaître les cancers et encourager la prévention.',
      story2: 'La mobilisation collective rassemble des personnes engagées autour d’un objectif commun : faire de la santé une priorité et promouvoir l’accès à une information fiable.',
      closing: 'La lutte contre les cancers nécessite une mobilisation et une attention qui se poursuivent au-delà des campagnes.',
      facts: ['Mobilisation', 'Prévention', 'Santé'],
      tags: ['Santé', 'Cancers', 'Sensibilisation']
    },
    {
      id: 'droits-5',
      image: 'img/galerie/droits/5.jpeg',
      category: 'Droits',
      theme: 'Droits des femmes',
      title: 'Un espace d’échange consacré aux droits des femmes',
      alt: 'Participante prenant part à un échange autour des droits des femmes',
      intro: 'Une participante prend part à un échange autour des droits des femmes et des enjeux qui les concernent.',
      storyTitle: 'S’informer et faire entendre sa voix',
      story1: 'Les rencontres et les échanges permettent de faire circuler l’information et d’aborder les droits des femmes dans un cadre d’écoute.',
      story2: 'Partager ses expériences et poser des questions contribue à renforcer la participation des femmes aux sujets qui touchent leur vie.',
      closing: 'Mwinue Asimame œuvre pour que les femmes soient informées, écoutées et actrices de leurs choix.',
      facts: ['Information', 'Droits', 'Participation'],
      tags: ['Droits des femmes', 'Écoute', 'Échanges']
    },
    {
      id: 'formations-5',
      image: 'img/galerie/formations/5.jpeg',
      category: 'Autonomisation',
      theme: 'Formation entrepreneuriale',
      title: 'Formation entrepreneuriale',
      alt: 'Groupe de participantes réuni lors d’une formation entrepreneuriale',
      intro: 'Un groupe de participantes est réuni à l’occasion d’une formation entrepreneuriale.',
      storyTitle: 'Un temps collectif pour apprendre',
      story1: 'La formation rassemble les participantes autour de l’entrepreneuriat et favorise l’apprentissage dans un cadre collectif.',
      story2: 'Les échanges entre participantes sont une occasion de partager des idées et de soutenir les démarches entrepreneuriales.',
      closing: 'En renforçant les capacités et les échanges, ces initiatives accompagnent l’autonomisation des femmes.',
      facts: ['Entrepreneuriat', 'Apprentissage', 'Partage'],
      tags: ['Autonomisation', 'Formation', 'Entrepreneuriat']
    }
  ];

  var requestedId = new URLSearchParams(window.location.search).get('photo');
  var currentIndex = photos.findIndex(function (photo) {
    return photo.id === requestedId;
  });

  if (currentIndex < 0) currentIndex = 0;

  var photo = photos[currentIndex];
  var previousPhoto = photos[(currentIndex - 1 + photos.length) % photos.length];
  var nextPhoto = photos[(currentIndex + 1) % photos.length];

  document.title = photo.title + ' — Galerie Mwinue Asimame';
  document.getElementById('photoDescription').content = photo.intro;
  document.getElementById('photoPageTitle').textContent = photo.title;
  document.getElementById('photoBreadcrumb').textContent = photo.title;
  document.getElementById('photoCategory').textContent = photo.category;
  document.getElementById('photoTheme').textContent = photo.theme;
  document.getElementById('photoImage').src = photo.image;
  document.getElementById('photoImage').alt = photo.alt;
  document.getElementById('photoEyebrow').textContent = photo.category;
  document.getElementById('photoTitle').textContent = photo.title;
  document.getElementById('photoIntro').textContent = photo.intro;
  document.getElementById('photoSectionTitle').textContent = photo.storyTitle;
  document.getElementById('photoStory1').textContent = photo.story1;
  document.getElementById('photoStory2').textContent = photo.story2;
  document.getElementById('photoClosing').textContent = photo.closing;
  document.getElementById('photoFact1').firstChild.textContent = photo.facts[0] + ' ';
  document.getElementById('photoFact2').firstChild.textContent = photo.facts[1] + ' ';
  document.getElementById('photoFact3').firstChild.textContent = photo.facts[2] + ' ';
  document.getElementById('photoTag1').textContent = photo.tags[0];
  document.getElementById('photoTag2').textContent = photo.tags[1];
  document.getElementById('photoTag3').textContent = photo.tags[2];

  document.getElementById('previousPhoto').href = 'portfolio-single.html?photo=' + previousPhoto.id;
  document.getElementById('previousPhotoTitle').textContent = previousPhoto.title;
  document.getElementById('nextPhoto').href = 'portfolio-single.html?photo=' + nextPhoto.id;
  document.getElementById('nextPhotoTitle').textContent = nextPhoto.title;
})();
