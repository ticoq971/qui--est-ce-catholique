import type { Character } from '../types';
import { ATTRIBUTE_QUESTIONS, CATEGORY_LABELS } from '../types';

export const CHARACTER_BIOS: Record<string, string> = {
  pierre: 'Pêcheur galiléen appelé par Jésus, il est le chef des apôtres et le premier pape. Traditionnellement martyr à Rome, il est considéré comme le fondement de l\'Église.',
  paul: 'Pharisien devenu apôtre après sa conversion sur le chemin de Damas. Il évangélise les païens et écrit une grande partie du Nouveau Testament.',
  'jean-apotre': 'Apôtre bien-aimé de Jésus, fils de Zébédée. Traditionnellement auteur du quatrième Évangile et de l\'Apocalypse.',
  andré: 'Frère de Pierre et premier apôtre appelé par Jésus. Il évangélise la Grèce et est martyrisé en croix de Saint-André.',
  'jacques-majeur': 'Fils de Zébédée et frère de Jean, proche de Jésus. Premier apôtre martyrisé sous Hérode Agrippa.',
  thomas: 'Apôtre connu pour son doute, qui croit en voyant le Christ ressuscité. Traditionnellement évangélisateur en Inde.',
  matthieu: 'Publicain devenu apôtre, auteur traditionnel du premier Évangile. Symbole de la conversion des pécheurs.',
  philippe: 'Apôtre de Bethsaïde qui amène Nathanaël à Jésus. Associé à l\'évangélisation en Asie Mineure.',
  barthélemy: 'Apôtre aussi appelé Nathanaël, homme sans artifice selon l\'Évangile. Traditionnellement martyr en Arménie.',
  jude: 'Apôtre, frère de Jacques le Mineur. Patron des causes désespérées dans la piété populaire.',
  matthias: 'Élu apôtre pour remplacer Judas après la Résurrection. Symbole de la continuité du collège apostolique.',

  'jean-paul-ii': 'Pape polonais (1978-2005), acteur majeur de la chute du communisme et de la jeunesse mondiale. Canonisé en 2014.',
  'jean-xxiii': 'Pape (1958-1963) qui convoque le Concile Vatican II. Surnommé « le pape bon » pour sa douceur et son ouverture.',
  'pie-x': 'Pape (1903-1914) réformateur de la liturgie et promoteur de la communion fréquente. Encouragea la musique sacrée populaire.',
  'gregoire-grand': 'Pape et Docteur de l\'Église au VIe siècle. Organisateur pastoral et associé au chant grégorien.',
  'clement-i': 'Pape de Rome au Ier siècle, successeur de Pierre. Traditionnellement martyrisé, jeté à la mer avec une ancre.',
  'leon-xiii': 'Pape (1878-1903) auteur de Rerum Novarum, première grande encyclique sociale de l\'Église.',
  'benoit-xvi': 'Pape allemand (2005-2013), théologien de renom. Premier pape à renoncer au pontificat depuis des siècles.',
  francois: 'Pape argentin depuis 2013, premier jésuite au trône de Pierre. Insiste sur la miséricorde, les pauvres et la sauvegarde de la création.',

  augustin: 'Évêque d\'Hippone (Algérie), Docteur de l\'Église. Ses Confessions et sa théologie marquent profondément l\'Occident chrétien.',
  'thomas-aquin': 'Dominicain italien, Docteur de l\'Église. Sa Summa Theologica structure la pensée catholique médiévale.',
  'jean-chrysostome': 'Évêque de Constantinople, prédicateur brillant surnommé « bouche d\'or ». Docteur de l\'Église.',
  basile: 'Évêque de Césarée, père du monachisme oriental et Docteur de l\'Église. Organisa la vie communautaire des moines.',
  ambroise: 'Évêque de Milan, Docteur de l\'Église. Baptisa saint Augustin et défendit l\'indépendance de l\'Église face au pouvoir.',
  jerome: 'Traducteur de la Bible en latin (Vulgate). Docteur de l\'Église, vécut longtemps comme ermite.',
  bonaventure: 'Franciscain et Docteur de l\'Église, dit « le séraphique ». Théologien et administrateur de l\'ordre franciscain.',
  'therese-avila': 'Carmélite espagnole, réformatrice et Docteur de l\'Église. Grande mystique, auteure de La Vie intérieure.',
  'catherine-sienne': 'Dominicaine italienne, conseillère des papes et Docteur de l\'Église. Mystique engagée pour l\'unité de l\'Église.',

  'francois-assise': 'Fondateur des Franciscains, amoureux de la pauvreté et de la création. Patron de l\'écologie et des animaux.',
  'ignace-loyola': 'Fondateur des Jésuites (Compagnie de Jésus). Auteur des Exercices spirituels, formateur de missionnaires.',
  dominique: 'Fondateur des Dominicains (Frères prêcheurs). Défenseur de l\'orthodoxie face aux hérésies du XIIIe siècle.',
  'benoit-nursie': 'Père du monachisme occidental. Sa règle, équilibrée entre prière et travail, structure encore de nombreux monastères.',
  patrick: 'Évangélisateur de l\'Irlande au Ve siècle. Symbole de la mission chrétienne en Europe du Nord.',
  'jean-bosco': 'Prêtre piémontais éducateur des jeunes. Fondateur des Salésiens, patron des écoliers.',
  'vincent-paul': 'Prêtre français au cœur immense pour les pauvres. Fondateur des Lazaristes et des Filles de la Charité.',
  'jean-croix': 'Carmélite espagnol, Docteur de l\'Église et poète mystique. Auteur de La Nuit obscure de l\'âme.',
  'francois-sales': 'Évêque de Genève, Docteur de l\'Église. Maître de la dévotion accessible à tous, fondateur des Visitation.',
  'padre-pio': 'Capucin italien du XXe siècle, stigmatisé et confesseur. Très populaire pour sa spiritualité et ses miracles rapportés.',
  'antoine-grands': 'Ermite égyptien, père du monachisme. Retiré dans le désert, modèle de vie consacrée.',
  nicolas: 'Évêque de Myre (Turquie actuelle), connu pour sa générosité envers les pauvres. Inspira la figure du Père Noël.',
  charlemagne: 'Empereur d\'Occident (800), protecteur de l\'Église et unificateur de l\'Europe. Canonisé par l\'Église.',
  'louis-ix': 'Roi de France (1226-1270), juste et pieux. Parti en croisade, modèle de roi chrétien.',

  'therese-lisieux': 'Carmélite normande, Docteur de l\'Église. Prône la « petite voie » de confiance enfantine en Dieu.',
  'jeanne-arc': 'Pucelle d\'Orléans, héroïne de la guerre de Cent Ans. Condamnée puis réhabilitée, canonisée en 1920.',
  claire: 'Compagne de François d\'Assise, fondatrice des Clarisses. Défendit son monastère en brandissant l\'ostensoir.',
  bernadette: 'Voyageuse de Lourdes en 1858. Religieuse humble, rapportera les apparitions de la Vierge Marie.',
  faustine: 'Religieuse polonaise, apôtre de la Miséricorde divine. Inspiratrice de la fête de la Divine Miséricorde.',
  hildegard: 'Bénédictine allemande, mystique et compositrice du XIIe siècle. Docteur de l\'Église depuis 2012.',
  'rose-lima': 'Première sainte canonisée d\'Amérique latine. Carmélite péruvienne, vie de pénitence et de prière.',
  monica: 'Mère africaine de saint Augustin. Modèle de persévérance dans la prière pour la conversion des siens.',
  rita: 'Religieuse italienne, surnommée « sainte des causes impossibles ». Marquée par de grands sacrifices familiaux.',
  lucie: 'Vierge et martyre de Syracuse (IIIe siècle). Patronne des mal des yeux et symbole de la lumière.',

  etienne: 'Premier martyr chrétien, lapidé selon les Actes des Apôtres. Modèle de fidélité jusqu\'au bout.',
  laurent: 'Diacre romain, distribuait les biens aux pauvres. Martyrisé sur un gril selon la tradition.',
  sebastien: 'Officier romain converti, tué par des flèches. Patron des athletes et des malades de la peste.',
  perpetue: 'Jeune mère martyr à Carthage avec sa servante Felicité. Témoin éloquent de la foi africaine primitive.',
  polycarpe: 'Évêque de Smyrne, disciple de Jean. Martyrisé à plus de 80 ans, lien entre apôtres et Pères de l\'Église.',
  'maximilian-kolbe': 'Frère franciscain polonais mort à Auschwitz en se substituant à un père de famille. Martyr du XXe siècle.',
  'oscar-romero': 'Archevêque du Salvador, défenseur des pauvres. Assassiné en plein office en 1980, canonisé en 2018.',
  georges: 'Soldat romain martyr, légende du combat contre le dragon. Patron de l\'Angleterre et de nombreux pays.',

  marie: 'Mère de Jésus et Mère de l\'Église. Figure centrale du christianisme, vénérée sous de multiples titres.',
  joseph: 'Époux de Marie et père nourricier de Jésus. Charpentier de Nazareth, patron de l\'Église universelle.',
  'jean-baptiste': 'Précurseur du Messie, baptise Jésus dans le Jourdain. Prêche la conversion et prépare la venue du Christ.',
  moise: 'Libérateur d\'Israël, reçoit les Dix Commandements sur le Sinaï. Prophète majeur de l\'Ancien Testament.',
  abraham: 'Patriarche de la foi, appelé par Dieu à quitter Ur. Père d\'Isaac et modèle de confiance en Dieu.',
  david: 'Roi d\'Israël, auteur traditionnel des Psaumes. Ancêtre du Messie selon les Évangiles.',
  salomon: 'Roi d\'Israël, fils de David, célèbre pour sa sagesse. Bâtisseur du Temple de Jérusalem.',
  elie: 'Prophète enlevé au ciel dans un char de feu. Combattit les idoles et annonça la venue du Messie.',
  noe: 'Construisit l\'Arche pour échapper au déluge. Symbole de fidélité et d\'alliance avec Dieu.',
  daniel: 'Prophète déporté à Babylone, sauvé dans la fosse aux lions. Interprète des songes des rois.',
  esther: 'Reine de Perse qui sauva son peuple juif du massacre. Héroïne du livre biblique qui porte son nom.',
  ruth: 'Moabite fidèle à sa belle-mère Naomi. Ancêtre du roi David et figure de l\'alliance et de la loyauté.',
};

export function getCharacterBio(character: Character): string {
  return CHARACTER_BIOS[character.id] ?? character.hint;
}

export function getCharacterTraits(character: Character): string[] {
  const traits: string[] = [CATEGORY_LABELS[character.category]];

  for (const q of ATTRIBUTE_QUESTIONS) {
    if (character.attributes[q.key]) {
      traits.push(q.label.replace(' ?', ''));
    }
  }

  return traits;
}
