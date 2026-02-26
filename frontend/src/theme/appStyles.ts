import { StyleSheet } from 'react-native';
import { colors } from './colors';

export const authStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingVertical: 20 },
  formContainer: { backgroundColor: colors.white, padding: 24, marginHorizontal: 20, borderRadius: 16, elevation: 4, shadowColor: colors.textDark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6 },
  
  title: { fontSize: 28, fontWeight: 'bold', color: colors.textDark, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: colors.textLight, textAlign: 'center', marginBottom: 32 },
  
  input: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.secondary, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, marginBottom: 12, color: colors.textDark },
  inputError: { borderColor: colors.error, backgroundColor: colors.errorBg },
  errorText: { color: colors.error, fontSize: 12, marginTop: -8, marginBottom: 12, marginLeft: 4 },
  
  button: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  buttonDisabled: { backgroundColor: colors.secondary },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: colors.textLight, fontSize: 14 },
  link: { color: colors.primary, fontSize: 14, fontWeight: 'bold' },

  strengthContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  strengthBarBackground: { flex: 1, height: 8, backgroundColor: colors.gray, borderRadius: 4, overflow: 'hidden', marginRight: 10 },
  strengthBarFill: { height: '100%', borderRadius: 4 },
  strengthLabel: { fontSize: 12, fontWeight: 'bold', width: 60, textAlign: 'right' },
  rulesContainer: { marginBottom: 16, paddingHorizontal: 4 },
  ruleMet: { color: colors.success, fontSize: 12, marginBottom: 2 },
  ruleUnmet: { color: colors.gray, fontSize: 12, marginBottom: 2 },
});

export const homeStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16, color: colors.textLight },
  errorText: { color: colors.error, fontSize: 16, textAlign: 'center', marginBottom: 10 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginVertical: 20, color: colors.textDark },
  
  formContainer: { backgroundColor: colors.white, padding: 16, marginHorizontal: 16, marginBottom: 16, borderRadius: 12, elevation: 2, shadowColor: colors.textDark, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, borderWidth: 1, borderColor: colors.secondary },
  editModeText: { color: colors.primary, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  input: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.secondary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, marginBottom: 12, color: colors.textDark },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  actionButtonsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  flex1: { flex: 1 },
  
  button: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  buttonDisabled: { backgroundColor: colors.secondary },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  cancelButton: { backgroundColor: colors.secondary, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cancelButtonText: { color: colors.textDark, fontSize: 16, fontWeight: 'bold' },

  listContainer: { paddingHorizontal: 16, paddingBottom: 20 },
  card: { backgroundColor: colors.white, padding: 20, borderRadius: 12, marginBottom: 16, shadowColor: colors.textDark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, borderWidth: 1, borderColor: colors.secondary },
  quoteText: { fontSize: 18, fontStyle: 'italic', color: colors.textDark, marginBottom: 12, lineHeight: 24 },
  authorText: { fontSize: 16, fontWeight: 'bold', color: colors.textLight, textAlign: 'right' },
  
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  cardActions: { flexDirection: 'row', gap: 8 },
  categoryBadge: { backgroundColor: colors.secondary, color: colors.textDark, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, fontSize: 12, fontWeight: 'bold', overflow: 'hidden' },
  
  editButton: { backgroundColor: colors.background, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, marginRight: 8, borderWidth: 1, borderColor: colors.primary },
  editButtonText: { color: colors.primary, fontSize: 12, fontWeight: 'bold' },
  deleteButton: { backgroundColor: colors.errorBg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  deleteButtonText: { color: colors.error, fontSize: 12, fontWeight: 'bold' },
  
  emptyText: { textAlign: 'center', color: colors.textLight, marginTop: 40, fontSize: 16 }
});