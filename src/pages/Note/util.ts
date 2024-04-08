export function noteChange(data: string) {
  const content = document.getElementById('content')!
  content.innerHTML = data
}
