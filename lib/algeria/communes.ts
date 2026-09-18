/**
 * Key communes per wilaya for the COD checkout form.
 *
 * This dataset covers the main communes of every wilaya. It is intentionally
 * a plain, extensible structure: when a customer's commune is not in the
 * list, the checkout offers an "Autre commune" free-text field, so no
 * legitimate order is ever blocked.
 * (Shipping providers such as Navex/Yalidine maintain their own office
 * lists — see lib/providers/shipping for office selection at shipment time.)
 */

export const COMMUNES: Record<number, string[]> = {
  1: ["Adrar", "Reggane", "Aoulef", "Sali", "Zaouiet Kounta", "Afilou", "Ouled Ahmar", "Bir Houda", "Akid Ibgoul", "Oum El Assel", "Timiaouine", "Timoudi"],
  2: ["Chlef", "Oued Fodda", "Ténès", "Beni Icha", "Boussemghoun", "Abou El Hassan", "Ben Aouf", "Oued Kheireddine", "Sidi Amar", "Cherchell", "Larbaâ"],
  3: ["Laghouat", "Aflou", "Ksar El Hirane", "Aïn Sefra", "Hassi R'Mel", "Rouissat"],
  4: ["Oum El Bouaghi", "Aïn Beïda", "Aïn M'lila", "Aïn Fakroun", "Meskiana", "Chelouf", "Negrine", "Oued Rhiou"],
  5: ["Batna", "Barika", "Aïn Touta", "Arris", "N'Gaous", "Tazoult", "Merouana", "Aïn Yelloul", "El Djalaa"],
  6: ["Béjaïa", "Akbou", "Amizour", "Aokas", "El Kseur", "Kherrata", "Sidi Aïch", "Taher", "Tichy", "Bordj Ben Aïssa", "Azeffoun", "Sidi Yacoub"],
  7: ["Biskra", "Tolga", "Sidi Okba", "Morsini", "Zeribet El Oued", "Oum Touyoune", "El Ksour"],
  8: ["Béchar", "Kenadsa", "Abadla", "Tabelbala", "M'Goun", "Boudni", "Lahmar", "El Abiodh Sidi Cheikh"],
  9: ["Blida", "Boufarik", "Larbaâ", "El Affroun", "Meftah", "Mouzaïa", "Ouled Yaïch", "Beni Mered", "Bouinan", "Chiffa", "El Eulma", "Moussy"],
  10: ["Bouira", "Lakhdaria", "Aïn Bessem", "Soghman", "Medjana", "Kadiria", "Larbaâ", "Tigzirt", "Draa El Mizan", "M'Chedallah", "El Hacim", "Djebala"],
  11: ["Tamanrasset", "Abalessa", "Tamraght", "In Ghar", "Tazrouk"],
  12: ["Tébessa", "Ouenza", "El Aouinet", "Bir El Ater", "Morsott", "Hammam Dhalaa", "El Kouif", "Chechar"],
  13: ["Tlemcen", "Maghnia", "Mansourah", "Ghazaouet", "Chetouane", "Rohoun", "Mazouna", "Aouf", "Remchi", "Hennaya", "El Khorbat"],
  14: ["Tiaret", "Frenda", "Khemis Miliana", "Souagui", "Sougueur", "Mansoura", "Rahouia", "Aïn Deheb", "Bougaâ", "El Hassasna"],
  15: ["Tizi Ouzou", "Azazga", "Draa El Mizan", "Larbaâ Nath Irathen", "Boghni", "Aït Athmane", "Draa Ben Khedda", "Tigzirt", "Tizi Gheniff", "Tigueddaline"],
  16: ["Alger", "Bab El Oued", "El Biar", "Cheraga", "Hydra", "Hussein Dey", "Bir Mourad Raïs", "Draria", "El Harrach", "Kouba", "Reghaïa", "Rouiba", "Ouled Fayet", "Birtouta", "Zéralda", "Bab Ezzouar", "El Eulma", "Ouled Mouanni"],
  17: ["Djelfa", "Aïn Oulmène", "Messaad", "El Idrissia", "Hassi Bahbah", "El Kala", "Aïn El Melh"],
  18: ["Jijel", "Taher", "El Milia", "Chekfa", "El Aouana", "Ziama Mansouriah", "Djamaa", "Sidi Mabrouk"],
  19: ["Sétif", "Aïn Oulmene", "El Eulma", "Aïn Arnat", "Bougaa", "Djemila", "Aïn Azel", "Guellala"],
  20: ["Saïda", "El Hassasna", "Aïn El Hadjar", "Zahana", "El Abiodh Sidi Cheikh", "Sfissifa", "Moghrar", "Ouled Brahim", "Hamma Bouziane"],
  21: ["Skikda", "Collo", "Aïn Beïda", "El Harrouch", "Tamalous", "Ramdane Djamel", "Ouled Ali", "Chetaïbi"],
  22: ["Sidi Bel Abbès", "Tlet N'Kour", "El Abiodh Sidi Cheikh", "Aïn El Berd", "Bouguirat", "Ben Badis", "Tessala", "Ouled Mimoun", "Leghzira", "Sidi Laouarbi"],
  23: ["Annaba", "El Bouni", "El Hadjar", "Aïn Berda", "Oued El Aneb", "Berrahal", "El Djeïr", "Azzaba"],
  24: ["Guelma", "Oued Zenati", "Bouchegouf", "Hammam Debba", "Guesmar", "Cheria", "El Hamdania", "Zerizer"],
  25: ["Constantine", "El Khroub", "Hamma", "Aïn Smara", "Didouche Mourad", "Ouled Rahmoune", "El Bouni", "Zighoud Youcef", "Aïn Abidha"],
  26: ["Médéa", "Berrouaghia", "Ksar El Boukhari", "Tablat", "Ouzera", "Bordj Bou Naâma"],
  27: ["Mostaganem", "Aïn Tedles", "Hassi Mameche", "Mesra", "Beni Saf", "Sidi Ali", "Aïn Nouissy", "Sidi Ghanem", "Telassa"],
  28: ["M'Sila", "Oued El Abbass", "Hassi Zaid", "Ksar Chellala", "Bou Hanifia", "Bazer Sassi"],
  29: ["Mascara", "Sig", "Mohammadia", "Tafoughalt", "Aïn Fares", "Ghriss", "Oued El Abta", "Benabdelmal", "Zahana", "Ouled Yaïch"],
  30: ["Ouargla", "Rouissat", "Ras El Aioun", "El Hadjira", "Sidi Khouiled", "Ben Khedecha", "Aïn Beïda"],
  31: ["Oran", "Es Sénia", "Arzew", "Bouteldja", "Aïn El Turk", "Oued Tlelat", "Gdyel", "Oued El Debbab", "Bir El Djir", "Boutlelis"],
  32: ["El Bayadh", "Aïn El Hadjar", "Brezina", "El Abiodh Sidi Cheikh", "El Ksar"],
  33: ["Illizi", "In Amguel", "Debdeb"],
  34: ["Bordj Bou Arréridj", "Ras El Oued", "El Achir", "Bordj Ghedir", "Ouled Derradj", "El Hachim"],
  35: ["Boumerdès", "Bordj Menaïel", "Boudouaou", "Dellys", "Khemis El Khechna", "Thénia", "Ouled Rummou", "Sidi Yahia", "Chrea", "Hadjout", "El Affroun", "Douaouda"],
  36: ["El Tarf", "El Kala", "Bouhadjar", "Ben M'Hidi", "Drean", "Aïn El Assel", "El Aouinet"],
  37: ["Tindouf", "Oum El Assel", "Idoukane"],
  38: ["Tissemsilt", "Theniet El Had", "Bordj Bou Naïl", "Lardjem", "El Abiodh Sidi Cheikh", "Magra"],
  39: ["El Oued", "Guemar", "Debda", "Magrane", "Robbah", "Bayadha", "F'kirina", "El Borma", "Tebesbest", "M'Nour"],
  40: ["Khenchela", "Chechar", "Aïn Touila", "Kais", "Barika", "Ouled Derradj", "El Hamma"],
  41: ["Souk Ahras", "Tadjenan", "Ferdjiouina", "El Hamdania", "Bou Saada", "Sidi Aïssa"],
  42: ["Tipaza", "Cherchell", "Koléa", "Ahel Aglan", "Fouka", "Bou Ismaïl", "Zemori", "Djidiouia", "Hammam Bou Hadjar"],
  43: ["Mila", "Chelghoum Laïd", "Tadjenan", "Grarem Gouga", "Chetaïbi", "Oued Athrioun", "Bou Saada"],
  44: ["Aïn Defla", "Khemis Miliana", "Boumedfaa", "El Attaf", "El Abiodh Sidi Cheikh", "Bordj Emiri", "Chettia", "Beni H'ddoud"],
  45: ["Naâma", "Moghrar", "Hassi Bounif", "El Abiodh Sidi Cheikh"],
  46: ["Aïn Témouchent", "El Malah", "Oued El Abtal", "El Amria", "Henchir Bouchagroun", "Sidi Laouarbi", "Aïn El Arbaa"],
  47: ["Ghardaïa", "Metlili", "Berriane", "El Guerrara", "Ben Isguen", "El Atteuf", "Bounoura", "Charba"],
  48: ["Relizane", "Mazouna", "Sidi Aïssa", "Ammari"],
  49: ["Timimoun", "Aougrout", "Charouine", "Tinerkouk", "El Gueddala"],
  50: ["Bordj Badji Mokhtar", "Tin Zaouatine", "Tin Tazzawarte"],
  51: ["Ouled Djellal", "Rogassa", "Djamaa", "El Assang", "Sidi M'Hamed"],
  52: ["Béni Abbès", "Igli", "Foggaret Ezzaouia"],
  53: ["In Salah", "Igli", "Tazrouk", "In Ghar"],
  54: ["In Guezzam", "Tin Zaouatine", "Tin Tao"],
  55: ["Touggourt", "Nezla", "Abadla", "Tebesbest", "M'Chounche", "Beni Ounif"],
  56: ["Djanet", "Ksar El Hirane", "El Ghazira", "Hassi El Ghadir"],
  57: ["El M'Ghair", "Ras El Oued", "Tilatil", "El Hadjira", "Sidi Slimane"],
  58: ["El Meniaa", "El Ghedira", "Zaouia", "Ouled Boughalem"],
};

export function getCommunes(wilayaCode: number): string[] {
  return COMMUNES[wilayaCode] ?? [];
}
