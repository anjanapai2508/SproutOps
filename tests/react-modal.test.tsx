import { describe,expect,it,vi } from 'vitest';
import { act,render,screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NewVideoModal } from '../app/src/components/NewVideoModal';

describe('NewVideoModal',()=>{
  it('keeps the draft visible while creation is pending',async()=>{
    let resolve!:()=>void;const pending=new Promise<void>((done)=>{resolve=done;});
    render(<NewVideoModal open onClose={vi.fn()} onCreate={()=>pending}/>);
    const title=screen.getByRole('textbox',{name:/video title/i});
    await userEvent.type(title,'A useful title');
    await userEvent.click(screen.getByRole('button',{name:'Create Video'}));
    expect((title as HTMLInputElement).value).toBe('A useful title');
    await act(async()=>resolve());
  });
});
