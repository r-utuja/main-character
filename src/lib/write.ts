import { toast } from './toast'

/** Every Firestore write goes through here: errors become a toast, never a crash. */
export async function safeWrite(
  action: () => Promise<unknown>,
  failMessage = "couldn't save that. try again?",
): Promise<boolean> {
  try {
    await action()
    return true
  } catch (err) {
    console.error(err)
    toast(failMessage)
    return false
  }
}
